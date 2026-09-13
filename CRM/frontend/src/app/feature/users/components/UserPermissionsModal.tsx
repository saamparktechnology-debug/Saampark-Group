"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Shield, 
  Check, 
  RotateCcw, 
  Save, 
  Loader2, 
  Search, 
  Layers, 
  CheckCheck, 
  UserCheck, 
  Crown
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { UserItem } from "../types"
import { useAuthStore } from "@/store/useAuthStore"
import { PermissionService } from "@/services/permissionService"
import { 
  CONFIGURABLE_MODULES, 
  CLEAN_MODULE_CATEGORIES, 
  ALL_ACTIONS,
  usePermissionStore, 
  ModuleActionFlags,
  DEFAULT_ROLE_ACTION_PERMISSIONS
} from "@/store/usePermissionStore"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { recordActivityLog } from "@/services/activityLogService"

const ACTIONS = [
  { key: "view", label: "View", icon: "👁️" },
  { key: "add", label: "Add", icon: "➕" },
  { key: "edit", label: "Edit", icon: "✏️" },
  { key: "delete", label: "Delete", icon: "🗑️" },
] as const

interface UserPermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserItem | null
  onSaved?: () => void
}

export function UserPermissionsModal({ isOpen, onClose, user: targetUser, onSaved }: UserPermissionsModalProps) {
  const { user: currentUser } = useAuthStore()
  const { 
    roleActionPermissions, 
    userActionPermissions,
    setUserAllModuleActions,
    fetchUserPermissions 
  } = usePermissionStore()

  const [matrix, setMatrix] = React.useState<Record<string, Record<string, boolean>>>({})
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Load user matrix when modal opens or targetUser changes
  React.useEffect(() => {
    if (!isOpen || !targetUser) return
    let isMounted = true
    const fetchMatrix = async () => {
      setIsLoading(true)
      try {
        const userRole = targetUser.role || "Teams"
        const res = await PermissionService.getUserMatrix(targetUser.id)
        const dbUserMatrix = res?.data?.data
        
        const fallbackMatrix = (userActionPermissions as any)[targetUser.id] || 
          (roleActionPermissions as any)[userRole] || 
          (DEFAULT_ROLE_ACTION_PERMISSIONS as any)[userRole] || {}
        
        const sourceMatrix = (dbUserMatrix && typeof dbUserMatrix === 'object') ? dbUserMatrix : fallbackMatrix

        const filled: Record<string, Record<string, boolean>> = {}
        CONFIGURABLE_MODULES.forEach(m => {
          filled[m] = {}
          ACTIONS.forEach(a => { 
            filled[m][a.key] = sourceMatrix[m]?.[a.key] ?? (userRole === 'Super Admin')
          })
        })
        if (isMounted) setMatrix(filled)
      } catch {
        const userRole = targetUser.role || "Teams"
        const fallbackMatrix = (roleActionPermissions as any)[userRole] || 
          (DEFAULT_ROLE_ACTION_PERMISSIONS as any)[userRole] || {}
        const filled: Record<string, Record<string, boolean>> = {}
        CONFIGURABLE_MODULES.forEach(m => {
          filled[m] = {}
          ACTIONS.forEach(a => { 
            filled[m][a.key] = fallbackMatrix[m]?.[a.key] ?? (userRole === 'Super Admin')
          })
        })
        if (isMounted) setMatrix(filled)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchMatrix()
    return () => { isMounted = false }
  }, [isOpen, targetUser, userActionPermissions, roleActionPermissions])

  const handleToggleAction = (module: string, actionKey: string) => {
    setMatrix(prev => ({
      ...prev,
      [module]: { ...prev[module], [actionKey]: !prev[module]?.[actionKey] }
    }))
  }

  const handleToggleRow = (module: string) => {
    const row = matrix[module] || {}
    const allChecked = ACTIONS.every(a => row[a.key])
    const newRow: Record<string, boolean> = {}
    ACTIONS.forEach(a => { newRow[a.key] = !allChecked })
    setMatrix(prev => ({ ...prev, [module]: newRow }))
  }

  const handleToggleCategory = (categoryKey: string) => {
    const group = CLEAN_MODULE_CATEGORIES[categoryKey]
    if (!group) return

    const allEnabled = group.modules.every(m => 
      ACTIONS.every(a => !!matrix[m.key]?.[a.key])
    )

    const updated: Record<string, Record<string, boolean>> = { ...matrix }
    group.modules.forEach(m => {
      updated[m.key] = { ...(updated[m.key] || {}) }
      ACTIONS.forEach(a => {
        updated[m.key][a.key] = !allEnabled
      })
    })
    setMatrix(updated)
  }

  const handleResetToRoleDefaults = () => {
    if (!targetUser) return
    const userRole = targetUser.role || "Teams"
    const roleMatrix = (roleActionPermissions as any)[userRole] || (DEFAULT_ROLE_ACTION_PERMISSIONS as any)[userRole] || {}
    const filled: Record<string, Record<string, boolean>> = {}
    CONFIGURABLE_MODULES.forEach(m => {
      filled[m] = {}
      ACTIONS.forEach(a => { 
        filled[m][a.key] = roleMatrix[m]?.[a.key] ?? false 
      })
    })
    setMatrix(filled)
  }

  const handleSetTemplate = (template: "full" | "view" | "none") => {
    const filled: Record<string, Record<string, boolean>> = {}
    CONFIGURABLE_MODULES.forEach(m => {
      filled[m] = {
        view: template === "full" || template === "view",
        add: template === "full",
        edit: template === "full",
        delete: template === "full",
      }
    })
    setMatrix(filled)
  }

  const handleSave = async () => {
    if (!targetUser) return
    setIsSaving(true)
    try {
      const typed: Record<string, ModuleActionFlags> = {}
      Object.keys(matrix).forEach(m => { 
        typed[m] = {
          view: !!matrix[m]?.view,
          add: !!matrix[m]?.add,
          edit: !!matrix[m]?.edit,
          delete: !!matrix[m]?.delete,
        }
      })

      await executeWithFeedback(async () => { 
        await PermissionService.saveUserMatrix(targetUser.id, typed)
        if (targetUser.email) {
          await PermissionService.saveUserMatrix(targetUser.email, typed)
        }
        setUserAllModuleActions(targetUser.id, typed)
        if (targetUser.email) {
          setUserAllModuleActions(targetUser.email, typed)
        }
        await fetchUserPermissions(targetUser.id)
        recordActivityLog({
          type: "permission",
          module: "Permissions",
          action: "User Permissions Overridden",
          description: `Custom permissions saved for user ${targetUser.name} (${targetUser.role || "Teams"})`,
          companyId: targetUser.companyId || (targetUser.companyIds && targetUser.companyIds[0]),
          branchId: targetUser.branchId,
          branchName: targetUser.branchName,
          details: `User: ${targetUser.name} (${targetUser.email || targetUser.id})`
        }).catch(() => {})
      }, {
        actionType: "update", 
        successTitle: "User Permissions Saved", 
        successMsg: "Custom permission overrides saved for " + targetUser.name + "."
      })

      onSaved?.()
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  // Filtered categories
  const visibleCategories = React.useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim()
    const result: Array<{ key: string; label: string; modules: { key: string; name: string; description: string }[] }> = []

    Object.entries(CLEAN_MODULE_CATEGORIES).forEach(([catKey, catData]) => {
      if (selectedCategory !== "all" && selectedCategory !== catKey) return

      const matchingModules = catData.modules.filter(m => {
        if (!searchLower) return true
        return (
          m.name.toLowerCase().includes(searchLower) ||
          m.key.toLowerCase().includes(searchLower) ||
          m.description.toLowerCase().includes(searchLower)
        )
      })

      if (matchingModules.length > 0) {
        result.push({
          key: catKey,
          label: catData.label,
          modules: matchingModules
        })
      }
    })

    return result
  }, [selectedCategory, searchQuery])

  // Active checks count
  const activeChecksCount = React.useMemo(() => {
    let count = 0
    Object.values(matrix).forEach(mod => {
      Object.values(mod).forEach(val => {
        if (val) count++
      })
    })
    return count
  }, [matrix])

  if (!isOpen || !targetUser) return null

  const isSuperAdmin = targetUser.role === "Super Admin"

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.96, y: 15 }} 
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  User Permissions: {targetUser.name}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {targetUser.role}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {targetUser.email} • {CONFIGURABLE_MODULES.length} Modules • {activeChecksCount} Checks Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSuperAdmin && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSetTemplate("full")}
                  className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 font-bold hover:underline cursor-pointer"
                >
                  Full Access
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTemplate("view")}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 font-semibold hover:underline cursor-pointer"
                >
                  View Only
                </button>
                <button
                  type="button"
                  onClick={handleResetToRoleDefaults}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Reset</span>
                </button>
              </div>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedCategory("all")}
              className={"px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer " + (
                selectedCategory === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
              )}
            >
              All ({CONFIGURABLE_MODULES.length})
            </button>
            {Object.entries(CLEAN_MODULE_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={"px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer " + (
                  selectedCategory === key
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                )}
              >
                {cat.label} ({cat.modules.length})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter modules..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Matrix Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isSuperAdmin ? (
            <div className="p-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 flex items-center gap-4">
              <Crown size={32} className="text-purple-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Super Admin Master Access Active</h4>
                <p className="text-xs opacity-90 mt-1">
                  Super Admin accounts have full master access across all modules, companies, and branches.
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-xs">Loading user permission matrix...</span>
            </div>
          ) : (
            <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[10px] sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="py-3 px-4 min-w-[200px]">Module</th>
                      <th className="py-3 px-2 text-center w-16">Row</th>
                      {ACTIONS.map(a => (
                        <th key={a.key} className="py-3 px-3 text-center min-w-[65px] font-bold text-zinc-700 dark:text-zinc-300 capitalize">
                          <span className="mr-1">{a.icon}</span> {a.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                    {visibleCategories.map(cat => (
                      <React.Fragment key={cat.key}>
                        {/* Category Header */}
                        <tr className="bg-zinc-100/70 dark:bg-zinc-800/40 border-t border-b border-zinc-200/60 dark:border-zinc-800">
                          <td colSpan={ACTIONS.length + 2} className="py-2 px-4">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                                <Layers size={13} className="text-blue-600" />
                                <span>{cat.label} ({cat.modules.length} Modules)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleCategory(cat.key)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCheck size={12} />
                                <span>Toggle Category</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Modules */}
                        {cat.modules.map(mod => {
                          const isAllChecked = ACTIONS.every(a => matrix[mod.key]?.[a.key])
                          return (
                            <tr key={mod.key} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="py-2.5 px-4">
                                <div className="font-bold text-zinc-900 dark:text-zinc-100">{mod.name}</div>
                                <div className="text-[10px] text-zinc-400 line-clamp-1">{mod.description}</div>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRow(mod.key)}
                                  className={"text-[9px] px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer " + (
                                    isAllChecked 
                                      ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400" 
                                      : "bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700"
                                  )}
                                >
                                  {isAllChecked ? "Clear" : "All"}
                                </button>
                              </td>
                              {ACTIONS.map(a => {
                                const checked = !!matrix[mod.key]?.[a.key]
                                return (
                                  <td key={a.key} className="py-2.5 px-3 text-center">
                                    <button 
                                      type="button"
                                      onClick={() => handleToggleAction(mod.key, a.key)} 
                                      title={"Toggle " + a.label + " for " + mod.name}
                                      className={"w-6 h-6 mx-auto rounded border flex items-center justify-center transition-all cursor-pointer " + (
                                        checked 
                                          ? "bg-blue-600 border-blue-600 text-white shadow-xs" 
                                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-transparent hover:border-blue-400"
                                      )}
                                    >
                                      {checked && <Check size={12} strokeWidth={3} />}
                                    </button>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-800/30">
          <span className="text-xs text-zinc-500">
            {activeChecksCount} permissions assigned to <strong>{targetUser.name}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isSuperAdmin} className="gap-2 font-bold">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Save User Matrix</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
