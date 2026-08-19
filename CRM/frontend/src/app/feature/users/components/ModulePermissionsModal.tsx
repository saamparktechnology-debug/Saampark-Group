"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Lock, CheckSquare, Square, Shield, Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useAuthStore, Role } from "@/store/useAuthStore"
import { usePermissionStore, ALL_MODULE_NAMES, ModuleName } from "@/store/usePermissionStore"

interface ModulePermissionsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ModulePermissionsModal({ isOpen, onClose }: ModulePermissionsModalProps) {
  const { user } = useAuthStore()
  const { rolePermissions, setRolePermissions, resetToDefaults } = usePermissionStore()

  // Determine which roles this user is authorized to manage:
  // Super Admin can manage Admin, Teams, User, Clients
  // Admin can manage Teams, User, Clients
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
  const [currentSelectedModules, setCurrentSelectedModules] = React.useState<ModuleName[]>([])

  React.useEffect(() => {
    if (manageableRoles.length > 0 && !manageableRoles.includes(activeRoleTab)) {
      setActiveRoleTab(manageableRoles[0])
    }
  }, [manageableRoles, activeRoleTab])

  React.useEffect(() => {
    if (activeRoleTab && rolePermissions[activeRoleTab]) {
      setCurrentSelectedModules(rolePermissions[activeRoleTab])
    }
  }, [activeRoleTab, rolePermissions, isOpen])

  if (!isOpen) return null

  const handleToggleModule = (modName: ModuleName) => {
    if (currentSelectedModules.includes(modName)) {
      setCurrentSelectedModules(currentSelectedModules.filter((m) => m !== modName))
    } else {
      setCurrentSelectedModules([...currentSelectedModules, modName])
    }
  }

  const handleSelectAll = () => {
    setCurrentSelectedModules([...ALL_MODULE_NAMES])
  }

  const handleDeselectAll = () => {
    setCurrentSelectedModules([])
  }

  const handleSave = () => {
    setRolePermissions(activeRoleTab, currentSelectedModules)
    alert(`Module access permissions updated successfully for role "${activeRoleTab}"!`)
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl glass-panel p-6 rounded-2xl border border-border shadow-2xl space-y-6 max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Lock size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  Module Access & Visibility Control
                </h2>
                <p className="text-xs text-muted-foreground">
                  {user?.role === "Super Admin"
                    ? "Configure which modules Admins, Teams, Users, and Clients can view and work upon."
                    : "Configure which modules Teams, Users, and Clients can view and work upon."}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
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
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-surface hover:bg-surface-hover text-muted-foreground"
                  }`}
                >
                  <Shield size={14} />
                  <span>{role}</span>
                </button>
              )
            })}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-surface-hover/30 p-3 rounded-xl border border-border/50 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                Allowed Modules: {currentSelectedModules.length} / {ALL_MODULE_NAMES.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetToDefaults}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={13} /> Reset Defaults
              </Button>
            </div>
          </div>

          {/* 20-Module Checkbox Grid */}
          <div className="overflow-y-auto flex-1 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_MODULE_NAMES.map((mod) => {
                const isChecked = currentSelectedModules.includes(mod)
                return (
                  <div
                    key={mod}
                    onClick={() => handleToggleModule(mod)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? "bg-primary/10 border-primary/40 text-foreground shadow-2xs"
                        : "bg-surface border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <span className="text-xs font-medium">{mod}</span>
                    {isChecked ? (
                      <CheckSquare size={16} className="text-primary shrink-0" />
                    ) : (
                      <Square size={16} className="text-muted-foreground shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50 shrink-0">
            <span className="text-xs text-muted-foreground">
              Changes take effect immediately for all users assigned to the <strong className="text-foreground">{activeRoleTab}</strong> role.
            </span>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleSave} className="gap-1.5">
                <Check size={16} /> Save Permissions
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
