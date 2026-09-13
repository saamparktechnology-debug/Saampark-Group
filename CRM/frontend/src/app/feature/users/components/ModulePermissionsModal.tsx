"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Lock, Shield, Check, RotateCcw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useAuthStore, Role } from "@/store/useAuthStore"
import {
  usePermissionStore,
  ALL_MODULE_NAMES,
  ModuleName,
  ModuleActionFlags,
  MODULE_ACTION_CONFIG,
  DEFAULT_FULL_ACTIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_ACTION_PERMISSIONS,
} from "@/store/usePermissionStore"
import { saveModuleDataToDB } from "@/lib/storageSync"
import { recordActivityLog } from "@/services/activityLogService"

interface ModulePermissionsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ModulePermissionsModal({ isOpen, onClose }: ModulePermissionsModalProps) {
  const { user } = useAuthStore()
  const {
    rolePermissions,
    roleActionPermissions,
    setRolePermissions,
    setRoleAllModuleActions,
    resetToDefaults,
  } = usePermissionStore()

  // Determine which roles this user is authorized to manage:
  // Super Admin can manage Admin, Teams, Clients
  // Admin can manage Teams, Clients
  const manageableRoles: Role[] = React.useMemo(() => {
    if (user?.role === "Super Admin") {
      return ["Admin", "Teams", "Clients"]
    }
    if (user?.role === "Admin") {
      return ["Teams", "Clients"]
    }
    return []
  }, [user])

  const [activeRoleTab, setActiveRoleTab] = React.useState<Role>(manageableRoles[0] || "Admin")
  const [roleMatrices, setRoleMatrices] = React.useState<Record<Role, Record<string, ModuleActionFlags>>>({} as any)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (manageableRoles.length > 0 && !manageableRoles.includes(activeRoleTab)) {
      setActiveRoleTab(manageableRoles[0])
    }
  }, [manageableRoles, activeRoleTab])

  const isCurrentSuperAdmin = user?.role === "Super Admin"

  // If Admin, strictly display ONLY the modules that this Admin can access
  const allowedConfigurableModules = React.useMemo(() => {
    if (isCurrentSuperAdmin) return ALL_MODULE_NAMES
    return ALL_MODULE_NAMES.filter((m) => {
      const uAny = user as any
      if (uAny?.allowedModules && Array.isArray(uAny.allowedModules)) {
        return uAny.allowedModules.includes(m)
      }
      if (uAny?.permissions?.allowedModules && Array.isArray(uAny.permissions.allowedModules)) {
        return uAny.permissions.allowedModules.includes(m)
      }
      return usePermissionStore.getState().isModuleAllowed(user, m)
    })
  }, [
    isCurrentSuperAdmin,
    user,
    user?.permissions,
    (user as any)?.allowedModules,
    rolePermissions,
    roleActionPermissions,
  ])

  // Initialize or re-populate all role matrices when modal opens or store permissions update
  React.useEffect(() => {
    if (!isOpen) return

    usePermissionStore.getState().fetchRolePermissions?.()

    const initialMatrices: Record<string, Record<string, ModuleActionFlags>> = {}
    const storeState = usePermissionStore.getState()
    const allRoles: Role[] = ["Super Admin", "Admin", "Teams", "Clients"]

    allRoles.forEach((r) => {
      const existingRoleMatrix = (storeState.roleActionPermissions && storeState.roleActionPermissions[r]) || DEFAULT_ROLE_ACTION_PERMISSIONS[r] || {}
      const existingRoleMods = (storeState.rolePermissions && storeState.rolePermissions[r]) || DEFAULT_ROLE_PERMISSIONS[r] || []

      const init: Record<string, ModuleActionFlags> = {}
      ALL_MODULE_NAMES.forEach((m) => {
        const config = MODULE_ACTION_CONFIG[m] || { hasAdd: true, hasEdit: true, hasDelete: true }
        if (existingRoleMatrix && existingRoleMatrix[m]) {
          init[m] = { ...existingRoleMatrix[m] }
        } else {
          const isModAllowed = existingRoleMods.includes(m)
          init[m] = isModAllowed
            ? {
                view: true,
                add: Boolean(config.hasAdd !== false && r !== "Clients"),
                edit: Boolean(config.hasEdit !== false && r !== "Clients"),
                delete: Boolean(config.hasDelete !== false && r === "Admin"),
              }
            : { view: false, add: false, edit: false, delete: false }
        }
      })
      initialMatrices[r] = init
    })

    setRoleMatrices(initialMatrices as Record<Role, Record<string, ModuleActionFlags>>)
  }, [isOpen])

  const currentRoleMatrix: Record<string, ModuleActionFlags> = React.useMemo(() => {
    return (roleMatrices && roleMatrices[activeRoleTab]) || {}
  }, [roleMatrices, activeRoleTab])

  const handleCheckboxChange = (mod: ModuleName, actionKey: keyof ModuleActionFlags, checked: boolean) => {
    const currentFlags = currentRoleMatrix[mod] || { view: false, add: false, edit: false, delete: false }
    const updatedFlags = { ...currentFlags, [actionKey]: checked }

    // If unchecking View, uncheck Add, Edit, Delete as well
    if (actionKey === "view" && !checked) {
      updatedFlags.add = false
      updatedFlags.edit = false
      updatedFlags.delete = false
    }

    // If checking Add, Edit, or Delete, automatically ensure View is checked
    if ((actionKey === "add" || actionKey === "edit" || actionKey === "delete") && checked) {
      updatedFlags.view = true
    }

    setRoleMatrices((prev) => ({
      ...prev,
      [activeRoleTab]: {
        ...(prev[activeRoleTab] || {}),
        [mod]: updatedFlags,
      },
    }))
  }

  const handleToggleModuleAll = (mod: ModuleName) => {
    const current = currentRoleMatrix[mod] || { view: false, add: false, edit: false, delete: false }
    const config = MODULE_ACTION_CONFIG[mod] || { hasAdd: true, hasEdit: true, hasDelete: true }
    const allOn = current.view && (!config.hasAdd || current.add) && (!config.hasEdit || current.edit) && (!config.hasDelete || current.delete)

    const nextFlags = allOn
      ? { view: false, add: false, edit: false, delete: false }
      : {
          view: true,
          add: config.hasAdd !== false && activeRoleTab !== "Clients",
          edit: config.hasEdit !== false && activeRoleTab !== "Clients",
          delete: config.hasDelete !== false && (activeRoleTab === "Admin" || activeRoleTab === "Super Admin"),
        }

    setRoleMatrices((prev) => ({
      ...prev,
      [activeRoleTab]: {
        ...(prev[activeRoleTab] || {}),
        [mod]: nextFlags,
      },
    }))
  }

  const handleSetGlobalTemplate = (template: "full" | "view" | "none") => {
    const nextMatrix: Record<string, ModuleActionFlags> = {}
    ALL_MODULE_NAMES.forEach((m) => {
      const config = MODULE_ACTION_CONFIG[m] || { hasAdd: true, hasEdit: true, hasDelete: true }

      if (template === "full") {
        nextMatrix[m] = {
          view: true,
          add: config.hasAdd !== false && activeRoleTab !== "Clients",
          edit: config.hasEdit !== false && activeRoleTab !== "Clients",
          delete: config.hasDelete !== false && (activeRoleTab === "Admin" || activeRoleTab === "Super Admin"),
        }
      } else if (template === "view") {
        nextMatrix[m] = {
          view: true,
          add: false,
          edit: false,
          delete: false,
        }
      } else {
        nextMatrix[m] = { view: false, add: false, edit: false, delete: false }
      }
    })

    setRoleMatrices((prev) => ({
      ...prev,
      [activeRoleTab]: nextMatrix,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedRolePermissions: Record<string, ModuleName[]> = { ...usePermissionStore.getState().rolePermissions }
      const updatedRoleActionPermissions: Record<string, Record<string, ModuleActionFlags>> = { ...usePermissionStore.getState().roleActionPermissions }

      // Save permissions for all roles configured in roleMatrices
      Object.entries(roleMatrices).forEach(([r, matrix]) => {
        const roleKey = r as Role
        const activeModules = ALL_MODULE_NAMES.filter((m) => {
          const flags = matrix[m]
          return flags && (flags.view || flags.add || flags.edit || flags.delete)
        })

        setRolePermissions(roleKey, activeModules)
        setRoleAllModuleActions(roleKey, matrix)

        updatedRolePermissions[roleKey] = activeModules
        updatedRoleActionPermissions[roleKey] = matrix
      })

      // Persist all roles to MySQL database table
      await saveModuleDataToDB("role_permissions", {
        rolePermissions: updatedRolePermissions,
        roleActionPermissions: updatedRoleActionPermissions,
      }, "all").catch(() => {})

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("saampark_data_synced"))
      }

      recordActivityLog({
        type: "permission",
        module: "Permissions",
        action: "Role Module Permissions Saved",
        description: `Granular role module permissions updated for roles: ${Object.keys(roleMatrices).join(", ")}`,
        details: `Configured roles: ${Object.keys(roleMatrices).join(", ")}`
      }).catch(() => {})

      alert(`Granular module action permissions updated and saved successfully!`)
      onClose()
    } finally {
      setIsSaving(false)
    }

  }

  if (!isOpen) return null

  // Count allowed modules
  const allowedCount = allowedConfigurableModules.filter((m) => {
    const f = currentRoleMatrix[m]
    return f && (f.view || f.add || f.edit || f.delete)
  }).length

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl glass-panel p-6 rounded-3xl border border-border shadow-2xl space-y-5 max-h-[92vh] flex flex-col overflow-hidden bg-surface/95"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  Module Access & Action Control
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure granular View, Add, Edit, and Delete action permissions per role.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Role Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-border/50 pb-3 overflow-x-auto shrink-0">
            <span className="text-xs font-semibold text-muted-foreground mr-2">Configuring Role:</span>
            {manageableRoles.map((role) => {
              const isActive = activeRoleTab === role
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRoleTab(role)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md scale-102"
                      : "bg-surface hover:bg-surface-hover text-muted-foreground"
                  }`}
                >
                  <Shield size={14} />
                  <span>{role}</span>
                </button>
              )
            })}
          </div>

          {/* Controls & Batch Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-hover/30 p-3.5 rounded-2xl border border-border/50 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">
                Active Modules: {allowedCount} / {allowedConfigurableModules.length}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSetGlobalTemplate("full")}
                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold hover:underline cursor-pointer"
              >
                Grant Full Access
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
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Defaults
              </button>
            </div>
          </div>

          {/* Granular Module Action Cards Grid */}
          <div className="overflow-y-auto flex-1 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {allowedConfigurableModules.map((mod) => {
                const flags = currentRoleMatrix[mod] || { view: false, add: false, edit: false, delete: false }
                const config = MODULE_ACTION_CONFIG[mod] || { hasAdd: true, hasEdit: true, hasDelete: true, description: "" }
                const allOn = flags.view && (!config.hasAdd || flags.add) && (!config.hasEdit || flags.edit) && (!config.hasDelete || flags.delete)
                const hasAny = flags.view || flags.add || flags.edit || flags.delete

                return (
                  <div
                    key={mod}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      hasAny
                        ? "bg-surface border-primary/30 shadow-2xs"
                        : "bg-surface/50 border-border/70 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-foreground">{mod}</span>
                        {config.description && (
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{config.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleModuleAll(mod)}
                        className="text-[10px] font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                      >
                        {allOn ? "Deselect" : "Select All"}
                      </button>
                    </div>

                    {/* Action Checkboxes */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
                      {/* View Action */}
                      <label className="flex items-center gap-1.5 text-[11px] select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={flags.view}
                          onChange={(e) => handleCheckboxChange(mod, "view", e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="text-foreground font-semibold">👁️ View</span>
                      </label>

                      {/* Add Action */}
                      {config.hasAdd !== false && (
                        <label className="flex items-center gap-1.5 text-[11px] select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={flags.add}
                            onChange={(e) => handleCheckboxChange(mod, "add", e.target.checked)}
                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span className="text-foreground font-semibold">➕ Add</span>
                        </label>
                      )}

                      {/* Edit Action */}
                      {config.hasEdit !== false && (
                        <label className="flex items-center gap-1.5 text-[11px] select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={flags.edit}
                            onChange={(e) => handleCheckboxChange(mod, "edit", e.target.checked)}
                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span className="text-foreground font-semibold">✏️ Edit</span>
                        </label>
                      )}

                      {/* Delete Action */}
                      {config.hasDelete !== false && (
                        <label className="flex items-center gap-1.5 text-[11px] select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={flags.delete}
                            onChange={(e) => handleCheckboxChange(mod, "delete", e.target.checked)}
                            className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
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

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50 shrink-0">
            <span className="text-xs text-muted-foreground">
              Granular action permissions apply to all accounts assigned to the <strong className="text-foreground">{activeRoleTab}</strong> role.
            </span>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={isSaving}
                onClick={handleSave}
                className="gap-1.5 font-bold"
              >
                <Check size={16} /> {isSaving ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
