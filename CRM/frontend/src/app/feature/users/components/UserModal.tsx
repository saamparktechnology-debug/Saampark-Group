"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Mail, Shield, Building, Phone, UserCheck, Lock, ShieldCheck, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { User as UserType, UserRole, UserStatus } from "../types"
import { api } from "@/lib/api"
import { 
  ALL_MODULE_NAMES, 
  ModuleName, 
  ModuleActionFlags, 
  DEFAULT_FULL_ACTIONS, 
  DEFAULT_VIEW_ONLY_ACTIONS, 
  normalizeRole,
  DEFAULT_ROLE_PERMISSIONS,
  usePermissionStore 
} from "@/store/usePermissionStore"

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: Partial<UserType>) => void
  editingUser?: UserType | null
}

export function UserModal({ isOpen, onClose, onSave, editingUser }: UserModalProps) {
  const { userPermissions, userActionPermissions, setUserPermissions, setUserAllModuleActions } = usePermissionStore()
  
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("Teams")
  const [companyId, setCompanyId] = React.useState("tech")
  const [department, setDepartment] = React.useState("Project Management")
  const [phone, setPhone] = React.useState("+91 96543 21098")
  const [password, setPassword] = React.useState("Password123")
  const [status, setStatus] = React.useState<UserStatus>("Active")
  const [allowedModules, setAllowedModules] = React.useState<ModuleName[]>([...ALL_MODULE_NAMES])
  
  // Matrix of checkboxes per module: { ModuleName: { view, add, edit, delete } }
  const [actionMatrix, setActionMatrix] = React.useState<Record<string, ModuleActionFlags>>(() => {
    const init: Record<string, ModuleActionFlags> = {}
    ALL_MODULE_NAMES.forEach((m) => {
      init[m] = { ...DEFAULT_FULL_ACTIONS } // Default: All 4 action checkboxes checked
    })
    return init
  })

  React.useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || "")
      setEmail(editingUser.email || "")
      setRole(editingUser.role || "Teams")
      setCompanyId(editingUser.companyId || "tech")
      setDepartment(editingUser.department || "Project Management")
      setPhone(editingUser.phone || "+91 96543 21098")
      setPassword(editingUser.password || "Password123")
      setStatus(editingUser.status || "Active")

      const userIdStr = String(editingUser.id)
      const emailStr = (editingUser.email || "").toLowerCase().trim()
      const normRole = normalizeRole(editingUser.role)
      const roleMods = DEFAULT_ROLE_PERMISSIONS[normRole] || [...ALL_MODULE_NAMES]

      // Prioritize explicit permissions on editingUser
      let userMatrix: Record<string, ModuleActionFlags> | null = null
      let userAllowedList: string[] | null = null

      if ((editingUser as any).permissions) {
        let pObj = typeof (editingUser as any).permissions === "string" 
          ? JSON.parse((editingUser as any).permissions) 
          : (editingUser as any).permissions
        if (pObj?.actionMatrix) userMatrix = pObj.actionMatrix
        if (Array.isArray(pObj?.allowedModules)) userAllowedList = pObj.allowedModules
      }

      if (!userMatrix) {
        userMatrix = userActionPermissions[userIdStr] || userActionPermissions[emailStr] || null
      }
      if (!userAllowedList) {
        userAllowedList = editingUser.allowedModules || userPermissions[userIdStr] || userPermissions[emailStr] || null
      }

      const fullMatrix: Record<string, ModuleActionFlags> = {}
      ALL_MODULE_NAMES.forEach((m) => {
        if (userMatrix && userMatrix[m] !== undefined) {
          fullMatrix[m] = { ...userMatrix[m] }
        } else if (userAllowedList && Array.isArray(userAllowedList)) {
          const isAllowed = userAllowedList.includes(m)
          fullMatrix[m] = isAllowed
            ? { ...DEFAULT_FULL_ACTIONS }
            : { view: false, add: false, edit: false, delete: false }
        } else {
          const isAllowedByRole = normRole === "Super Admin" || normRole === "Admin" || roleMods.includes(m as ModuleName)
          fullMatrix[m] = isAllowedByRole
            ? { ...DEFAULT_FULL_ACTIONS }
            : { view: false, add: false, edit: false, delete: false }
        }
      })

      setActionMatrix(fullMatrix)

      const activeMods = ALL_MODULE_NAMES.filter((m) => {
        const flags = fullMatrix[m]
        return flags ? (flags.view || flags.add || flags.edit || flags.delete) : false
      })
      setAllowedModules(activeMods.includes("Dashboard") ? activeMods : ["Dashboard", ...activeMods])
    } else {
      setName("")
      setEmail("")
      setRole("Teams")
      setCompanyId("tech")
      setDepartment("Project Management")
      setPhone("+91 96543 21098")
      setStatus("Active")
      setAllowedModules([...ALL_MODULE_NAMES])
      
      const init: Record<string, ModuleActionFlags> = {}
      ALL_MODULE_NAMES.forEach((m) => {
        init[m] = { ...DEFAULT_FULL_ACTIONS }
      })
      setActionMatrix(init)
    }
  }, [editingUser?.id, isOpen])

  if (!isOpen) return null

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    const norm = normalizeRole(newRole)
    const roleMods = DEFAULT_ROLE_PERMISSIONS[norm] || [...ALL_MODULE_NAMES]
    setAllowedModules(roleMods)

    const init: Record<string, ModuleActionFlags> = {}
    ALL_MODULE_NAMES.forEach((m) => {
      const isAllowed = roleMods.includes(m as ModuleName)
      init[m] = isAllowed
        ? { ...DEFAULT_FULL_ACTIONS }
        : { view: false, add: false, edit: false, delete: false }
    })
    setActionMatrix(init)
  }

  const handleCheckboxChange = (mod: ModuleName, actionKey: keyof ModuleActionFlags, checked: boolean) => {
    const currentFlags = actionMatrix[mod] || { ...DEFAULT_FULL_ACTIONS }
    const updatedFlags = { ...currentFlags, [actionKey]: checked }
    const nextMatrix = { ...actionMatrix, [mod]: updatedFlags }
    setActionMatrix(nextMatrix)

    const hasAnyChecked = updatedFlags.view || updatedFlags.add || updatedFlags.edit || updatedFlags.delete
    if (!hasAnyChecked) {
      setAllowedModules(allowedModules.filter((m) => m !== mod))
    } else if (!allowedModules.includes(mod)) {
      setAllowedModules([...allowedModules, mod])
    }
  }

  const handleToggleModuleAll = (mod: ModuleName) => {
    const current = actionMatrix[mod] || { ...DEFAULT_FULL_ACTIONS }
    const allOn = current.view && current.add && current.edit && current.delete
    const nextFlags = allOn
      ? { view: false, add: false, edit: false, delete: false }
      : { view: true, add: true, edit: true, delete: true }
    
    setActionMatrix({ ...actionMatrix, [mod]: nextFlags })
    if (allOn) {
      setAllowedModules(allowedModules.filter((m) => m !== mod))
    } else if (!allowedModules.includes(mod)) {
      setAllowedModules([...allowedModules, mod])
    }
  }

  const handleSetGlobalTemplate = (template: "full" | "view" | "none") => {
    const nextMatrix: Record<string, ModuleActionFlags> = {}
    ALL_MODULE_NAMES.forEach((m) => {
      if (template === "full") {
        nextMatrix[m] = { ...DEFAULT_FULL_ACTIONS }
      } else if (template === "view") {
        nextMatrix[m] = { ...DEFAULT_VIEW_ONLY_ACTIONS }
      } else {
        nextMatrix[m] = { view: false, add: false, edit: false, delete: false }
      }
    })
    setActionMatrix(nextMatrix)
    if (template === "none") {
      setAllowedModules([])
    } else {
      setAllowedModules([...ALL_MODULE_NAMES])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Partial<UserType> = {
      name,
      email,
      role,
      companyId,
      companyName: companyId === "all" ? "SAAMPARK Group (All)" : companyId === "tech" ? "SAAMPARK Technology" : "SAAMPARK Digital Marketing",
      department,
      phone,
      password: password || "Password123",
      status,
    }

    const targetId = editingUser ? editingUser.id : email.toLowerCase().trim()
    const userIdStr = String(targetId)
    const emailNorm = email.toLowerCase().trim()

    setUserPermissions(userIdStr, allowedModules)
    setUserAllModuleActions(userIdStr, actionMatrix)

    // Sync to email key as well
    setUserPermissions(emailNorm, allowedModules)
    setUserAllModuleActions(emailNorm, actionMatrix)

    // Sync permissions locally and pass to onSave
    const permissions = { actionMatrix, allowedModules }

    onSave({
      ...payload,
      permissions,
    } as any)
    onClose()
  }


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary" size={20} />
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {editingUser ? "Edit User Account & Checkbox Permissions" : "Add New User Account"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Multi-select exact action checkboxes (View, Add, Edit, Delete) for each of the 20 CRM modules.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-surface-hover rounded-lg text-muted-foreground">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
                <User size={14} /> Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya Roy"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
                <Mail size={14} /> Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ananya@saampark.in"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
                  <Shield size={14} /> User Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Teams">Teams</option>
                  <option value="Clients">Clients</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
                  <Building size={14} /> Assigned Company *
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="tech">SAAMPARK Technology</option>
                  <option value="digital">SAAMPARK Digital Marketing</option>
                  <option value="all">All Companies (Super Admin)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} /> Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <Lock size={14} /> Initial / Account Password *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@!"
                    let gen = "Spk#"
                    for (let i = 0; i < 6; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length))
                    setPassword(gen)
                  }}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  🎲 Generate Random Password
                </button>
              </div>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (e.g. Password123)"
                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Set the initial password. A welcome email with login credentials and instructions to change password will be sent automatically.</p>
            </div>



            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
                <UserCheck size={14} /> Account Status
              </label>
              <div className="flex items-center gap-4 pt-1">
                {(["Active", "Inactive", "Pending"] as UserStatus[]).map((st) => (
                  <label key={st} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="status"
                      value={st}
                      checked={status === st}
                      onChange={() => setStatus(st)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="capitalize">{st}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Granular Module Action Checkboxes Section */}
            <div className="space-y-3 pt-3 border-t border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lock size={14} className="text-primary" />
                    Granular Action Permission Checkboxes ({ALL_MODULE_NAMES.length} Modules)
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Check one, two, three, or all four explicit action permissions per module.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSetGlobalTemplate("full")}
                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-semibold hover:underline"
                  >
                    Check All 4 Actions (Full)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGlobalTemplate("view")}
                    className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-semibold hover:underline"
                  >
                    View Only All (👁️)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGlobalTemplate("none")}
                    className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300 font-semibold hover:underline"
                  >
                    Uncheck All
                  </button>
                </div>
              </div>

              {/* 20 Module Permission Cards Grid with Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-84 overflow-y-auto p-3 bg-surface-hover/30 rounded-xl border border-border/50">
                {ALL_MODULE_NAMES.map((mod) => {
                  const flags = actionMatrix[mod] || { ...DEFAULT_FULL_ACTIONS }
                  return (
                    <div
                      key={mod}
                      className="p-3 rounded-xl border bg-background dark:bg-zinc-800/90 border-border/80 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">{mod}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleModuleAll(mod)}
                          className="text-[10px] font-semibold text-primary hover:underline"
                        >
                          {flags.view && flags.add && flags.edit && flags.delete ? "Deselect All" : "Select All"}
                        </button>
                      </div>

                      {/* 4 Action Checkboxes */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 border-t border-border/40">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={flags.view}
                            onChange={(e) => handleCheckboxChange(mod, "view", e.target.checked)}
                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">👁️ View</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={flags.add}
                            onChange={(e) => handleCheckboxChange(mod, "add", e.target.checked)}
                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">➕ Add</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={flags.edit}
                            onChange={(e) => handleCheckboxChange(mod, "edit", e.target.checked)}
                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">✏️ Edit</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                          <input
                            type="checkbox"
                            checked={flags.delete}
                            onChange={(e) => handleCheckboxChange(mod, "delete", e.target.checked)}
                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">🗑️ Delete</span>
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50 shrink-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingUser ? "Save Changes" : "Create Account"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
