"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Mail, Shield, Building, Phone, Lock, UserCheck, ShieldCheck, Check, Info } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { UserItem as UserType, UserRole, UserStatus } from "../types"
import { 
  usePermissionStore, 
  CONFIGURABLE_MODULES, 
  ModuleName, 
  ModuleActionFlags, 
  DEFAULT_FULL_ACTIONS, 
  DEFAULT_VIEW_ONLY_ACTIONS, 
  MODULE_ACTION_CONFIG,
  normalizeRole, 
  DEFAULT_ROLE_PERMISSIONS 
} from "@/store/usePermissionStore"

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: Partial<UserType>) => void
  editingUser?: UserType | null
}

export function UserModal({ isOpen, onClose, onSave, editingUser }: UserModalProps) {
  const { userActionPermissions, userPermissions, setUserPermissions, setUserAllModuleActions } = usePermissionStore()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("Teams")
  const [companyId, setCompanyId] = React.useState<string>("tech")
  const [department, setDepartment] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("Password123")
  const [status, setStatus] = React.useState<UserStatus>("Active")

  // Matrix of active module checkboxes per user
  const [actionMatrix, setActionMatrix] = React.useState<Record<string, ModuleActionFlags>>({})
  const [allowedModules, setAllowedModules] = React.useState<ModuleName[]>([])

  React.useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || "")
      setEmail(editingUser.email || "")
      setRole(editingUser.role || "Teams")
      setCompanyId(editingUser.companyId || "tech")
      setDepartment(editingUser.department || "")
      setPhone(editingUser.phone || "")
      setStatus(editingUser.status || "Active")
      setPassword(editingUser.password || "Password123")

      const userIdStr = String(editingUser.id)
      const emailNorm = (editingUser.email || "").toLowerCase().trim()
      const existingMatrix =
        userActionPermissions[userIdStr] ||
        (emailNorm ? userActionPermissions[emailNorm] : undefined) ||
        (editingUser.permissions?.actionMatrix)

      const existingMods =
        userPermissions[userIdStr] ||
        (emailNorm ? userPermissions[emailNorm] : undefined) ||
        (editingUser.permissions?.allowedModules)

      const norm = normalizeRole(editingUser.role || "Teams")
      const fallbackMods = DEFAULT_ROLE_PERMISSIONS[norm] || [...CONFIGURABLE_MODULES]
      const activeAllowed = existingMods && existingMods.length > 0 ? existingMods : fallbackMods

      const fullMatrix: Record<string, ModuleActionFlags> = {}
      CONFIGURABLE_MODULES.forEach((m) => {
        if (existingMatrix && existingMatrix[m]) {
          fullMatrix[m] = { ...existingMatrix[m] }
        } else if (activeAllowed.includes(m as ModuleName)) {
          fullMatrix[m] = { ...DEFAULT_FULL_ACTIONS }
        } else {
          fullMatrix[m] = { view: false, add: false, edit: false, delete: false }
        }
      })

      setActionMatrix(fullMatrix)
      setAllowedModules(CONFIGURABLE_MODULES.filter(m => {
        const flags = fullMatrix[m]
        return flags ? (flags.view || flags.add || flags.edit || flags.delete) : false
      }))
    } else {
      setName("")
      setEmail("")
      setRole("Teams")
      setCompanyId("tech")
      setDepartment("Software Engineering")
      setPhone("+91 98765 43210")
      setStatus("Active")
      setPassword("Password123")
      setAllowedModules([...CONFIGURABLE_MODULES])
      
      const init: Record<string, ModuleActionFlags> = {}
      CONFIGURABLE_MODULES.forEach((m) => {
        init[m] = { ...DEFAULT_FULL_ACTIONS }
      })
      setActionMatrix(init)
    }
  }, [editingUser?.id, isOpen])

  if (!isOpen) return null

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    const norm = normalizeRole(newRole)
    const roleMods = DEFAULT_ROLE_PERMISSIONS[norm] || [...CONFIGURABLE_MODULES]
    setAllowedModules(roleMods)

    const init: Record<string, ModuleActionFlags> = {}
    CONFIGURABLE_MODULES.forEach((m) => {
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
    const config = MODULE_ACTION_CONFIG[mod] || { hasAdd: true, hasEdit: true, hasDelete: true }
    const allOn = current.view && (!config.hasAdd || current.add) && (!config.hasEdit || current.edit) && (!config.hasDelete || current.delete)
    
    const nextFlags = allOn
      ? { view: false, add: false, edit: false, delete: false }
      : { 
          view: true, 
          add: config.hasAdd !== false, 
          edit: config.hasEdit !== false, 
          delete: config.hasDelete !== false 
        }
    
    setActionMatrix({ ...actionMatrix, [mod]: nextFlags })
    if (allOn) {
      setAllowedModules(allowedModules.filter((m) => m !== mod))
    } else if (!allowedModules.includes(mod)) {
      setAllowedModules([...allowedModules, mod])
    }
  }

  const handleSetGlobalTemplate = (template: "full" | "view" | "none") => {
    const nextMatrix: Record<string, ModuleActionFlags> = {}
    CONFIGURABLE_MODULES.forEach((m) => {
      const config = MODULE_ACTION_CONFIG[m] || { hasAdd: true, hasEdit: true, hasDelete: true }
      if (template === "full") {
        nextMatrix[m] = { 
          view: true, 
          add: config.hasAdd !== false, 
          edit: config.hasEdit !== false, 
          delete: config.hasDelete !== false 
        }
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
      setAllowedModules([...CONFIGURABLE_MODULES])
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
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={22} />
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {editingUser ? "Edit User Account & Granular Permissions" : "Add New User Account & Assign Permissions"}
                </h2>
                <p className="text-xs text-zinc-500">
                  Configure explicit module permissions: 👁️ View, ➕ Add, ✏️ Edit, and 🗑️ Delete.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <User size={14} /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Mail size={14} /> Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@saampark.in"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Shield size={14} /> User Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden font-bold"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Teams">Teams</option>
                  <option value="Clients">Clients</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Building size={14} /> Assigned Workspace Company *
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden"
                >
                  <option value="tech">SAAMPARK Technology</option>
                  <option value="digital">SAAMPARK Digital Marketing</option>
                  <option value="all">All Companies (Super Admin)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Department / Unit
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Software Engineering & Delivery"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} /> Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Lock size={14} /> Initial Login Password *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter initial password"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <UserCheck size={14} /> Account Status
                </label>
                <div className="flex items-center gap-4 pt-2">
                  {(["Active", "Inactive", "Pending"] as UserStatus[]).map((st) => (
                    <label key={st} className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="status"
                        value={st}
                        checked={status === st}
                        onChange={() => setStatus(st)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize font-medium text-zinc-700 dark:text-zinc-300">{st}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Granular Module Action Checkboxes Section */}
            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-blue-600" />
                    <span>Module Access & Action Permissions ({CONFIGURABLE_MODULES.length} Functional Modules)</span>
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Dashboard is globally enabled. Select exact action rights (View, Add, Edit, Delete) per module.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSetGlobalTemplate("full")}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold hover:underline cursor-pointer"
                  >
                    Grant Full Access (All)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGlobalTemplate("view")}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-semibold hover:underline cursor-pointer"
                  >
                    View Only All (👁️)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGlobalTemplate("none")}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold hover:underline cursor-pointer"
                  >
                    Revoke All
                  </button>
                </div>
              </div>

              {/* Module Action Cards Grid with Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-3 bg-zinc-50/50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60">
                {CONFIGURABLE_MODULES.map((mod) => {
                  const flags = actionMatrix[mod] || { ...DEFAULT_FULL_ACTIONS }
                  const config = MODULE_ACTION_CONFIG[mod] || { hasAdd: true, hasEdit: true, hasDelete: true, description: "" }

                  return (
                    <div
                      key={mod}
                      className="p-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{mod}</span>
                          {config.description && (
                            <p className="text-[10px] text-zinc-400 leading-tight">{config.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleModuleAll(mod)}
                          className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                        >
                          {flags.view && (!config.hasAdd || flags.add) && (!config.hasEdit || flags.edit) && (!config.hasDelete || flags.delete) ? "Deselect" : "Select All"}
                        </button>
                      </div>

                      {/* Action Checkboxes */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        {/* View Action */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none">
                          <input
                            type="checkbox"
                            checked={flags.view}
                            onChange={(e) => handleCheckboxChange(mod, "view", e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">👁️ View</span>
                        </label>

                        {/* Add Action */}
                        {config.hasAdd !== false && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none">
                            <input
                              type="checkbox"
                              checked={flags.add}
                              onChange={(e) => handleCheckboxChange(mod, "add", e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                            />
                            <span className="text-zinc-700 dark:text-zinc-300 font-semibold">➕ Add</span>
                          </label>
                        )}

                        {/* Edit Action */}
                        {config.hasEdit !== false && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none">
                            <input
                              type="checkbox"
                              checked={flags.edit}
                              onChange={(e) => handleCheckboxChange(mod, "edit", e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                            />
                            <span className="text-zinc-700 dark:text-zinc-300 font-semibold">✏️ Edit</span>
                          </label>
                        )}

                        {/* Delete Action */}
                        {config.hasDelete !== false && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none">
                            <input
                              type="checkbox"
                              checked={flags.delete}
                              onChange={(e) => handleCheckboxChange(mod, "delete", e.target.checked)}
                              className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                            />
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">🗑️ Delete</span>
                          </label>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                {editingUser ? "Save User & Permissions" : "Create Account & Permissions"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
