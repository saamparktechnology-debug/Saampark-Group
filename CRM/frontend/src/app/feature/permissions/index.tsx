"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Plus, Search, Edit, Trash2, X, Check, Lock, UserCheck, RotateCcw, Save, Loader2, Sparkles } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { PermissionService } from "@/services/permissionService"
import { CONFIGURABLE_MODULES, usePermissionStore, ModuleActionFlags } from "@/store/usePermissionStore"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { getUsers } from "@/app/feature/users/services/userService"
import { UserItem } from "@/app/feature/users/types"

type Tab = "roles" | "permissions" | "user-permissions" | "custom-roles"

interface CustomRole { id: string; name: string; description?: string; permissionCount?: number }

const ALL_ACTIONS = ["view", "add", "edit", "delete"] as const

const DEFAULT_ROLES = [
  { name: "Super Admin", description: "Full system access with all master permissions across all companies", permissionCount: ALL_ACTIONS.length * CONFIGURABLE_MODULES.length },
  { name: "Admin", description: "Administrative access to configure and manage assigned company modules", permissionCount: ALL_ACTIONS.length * CONFIGURABLE_MODULES.length },
  { name: "Teams", description: "Operational team member access to assigned day-to-day modules", permissionCount: 3 * CONFIGURABLE_MODULES.length },
  { name: "Clients", description: "Restricted client portal access to tickets, invoices, and messaging", permissionCount: 1 * CONFIGURABLE_MODULES.length },
]

export default function PermissionsMain() {
  const { user: currentUser, activeCompanyId, activeBranchId, companies, branches } = useAuthStore()
  const { 
    rolePermissions, 
    roleActionPermissions, 
    userActionPermissions,
    setRoleAllModuleActions, 
    setUserAllModuleActions,
    fetchRolePermissions,
    fetchUserPermissions,
  } = usePermissionStore()

  const [activeTab, setActiveTab] = React.useState<Tab>("roles")
  const [customRoles, setCustomRoles] = React.useState<CustomRole[]>([])
  const [usersList, setUsersList] = React.useState<UserItem[]>([])
  const [selectedRole, setSelectedRole] = React.useState<string>("Admin")
  const [selectedUserId, setSelectedUserId] = React.useState<string>("")
  const [permissionMatrix, setPermissionMatrix] = React.useState<Record<string, Record<string, boolean>>>({})
  const [userPermissionMatrix, setUserPermissionMatrix] = React.useState<Record<string, Record<string, boolean>>>({})
  const [isLoadingMatrix, setIsLoadingMatrix] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  
  // Custom role modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<CustomRole | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<CustomRole | null>(null)
  const [formName, setFormName] = React.useState("")
  const [formDescription, setFormDescription] = React.useState("")

  const loadRoles = React.useCallback(async () => {
    try { 
      const res = await PermissionService.getCustomRoles()
      const data = res?.data?.data || res?.data || res
      setCustomRoles(Array.isArray(data) ? data : []) 
    } catch { }
  }, [])

  const loadUsersList = React.useCallback(async () => {
    try {
      const list = await getUsers("all")
      setUsersList(Array.isArray(list) ? list : [])
    } catch { }
  }, [])

  React.useEffect(() => { 
    loadRoles()
    loadUsersList()
  }, [loadRoles, loadUsersList])

  // Filter users strictly matching the active company and branch view (identical to Users section)
  const visibleUsersList = React.useMemo(() => {
    if (!usersList || usersList.length === 0) return []
    const isSuperAdmin = currentUser?.role === "Super Admin"
    const targetComp = (activeCompanyId || currentUser?.companyId || "").toLowerCase().trim()
    const targetBranch = activeBranchId || currentUser?.branchId

    let filtered = usersList

    if (!isSuperAdmin) {
      filtered = filtered.filter((u) => u.role !== "Super Admin")
    }

    if (targetComp && targetComp !== "all") {
      const matchedCompany = companies.find(
        (c) =>
          String(c.id).toLowerCase().trim() === targetComp ||
          String(c.slug || "").toLowerCase().trim() === targetComp ||
          String(c.name || "").toLowerCase().trim() === targetComp
      )
      const validTargetCompIds = new Set<string>([
        targetComp,
        ...(matchedCompany?.id ? [String(matchedCompany.id).toLowerCase().trim()] : []),
        ...(matchedCompany?.slug ? [String(matchedCompany.slug).toLowerCase().trim()] : []),
        ...(matchedCompany?.name ? [String(matchedCompany.name).toLowerCase().trim()] : []),
      ])

      filtered = filtered.filter((u) => {
        if (u.role === "Super Admin") {
          const sCompIds = (u.companyIds || [u.companyId]).map(id => String(id || "").toLowerCase().trim())
          return sCompIds.some(id => validTargetCompIds.has(id)) || u.email === "hiisupriya@gmail.com"
        }

        const uCompIds = (u.companyIds && u.companyIds.length > 0)
          ? u.companyIds.map(id => String(id).toLowerCase().trim())
          : (u.companyId ? [String(u.companyId).toLowerCase().trim()] : [])
        
        if (u.companyName) {
          uCompIds.push(String(u.companyName).toLowerCase().trim())
        }

        return uCompIds.some(id => validTargetCompIds.has(id))
      })
    }

    if (targetBranch && targetBranch !== "all") {
      const targetBranchObj = branches.find(b => b.id === targetBranch || b.name.toLowerCase() === targetBranch.toLowerCase())
      const targetBranchId = String(targetBranchObj?.id || targetBranch).toLowerCase().trim()
      const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

      filtered = filtered.filter((u) => {
        if (u.role === "Super Admin") return true
        const uBranchIds = (u.branchIds && u.branchIds.length > 0)
          ? u.branchIds.map(id => String(id).toLowerCase().trim())
          : (u.branchId ? [String(u.branchId).toLowerCase().trim()] : [])
        const uBranchName = String(u.branchName || "").toLowerCase().trim()

        return (
          uBranchIds.includes(targetBranchId) ||
          (targetBranchName && uBranchIds.includes(targetBranchName)) ||
          String(u.branchId || "").toLowerCase().trim() === targetBranchId ||
          (targetBranchName && (uBranchName === targetBranchName || String(u.branchId || "").toLowerCase().trim() === targetBranchName))
        )
      })
    }

    return filtered
  }, [usersList, currentUser, activeCompanyId, activeBranchId, companies, branches])

  // Sync selectedUserId to visible users
  React.useEffect(() => {
    if (visibleUsersList.length > 0) {
      if (!selectedUserId || !visibleUsersList.some(u => u.id === selectedUserId)) {
        setSelectedUserId(visibleUsersList[0].id)
      }
    } else {
      setSelectedUserId("")
    }
  }, [visibleUsersList, selectedUserId])

  // Load role matrix from backend when selectedRole changes
  React.useEffect(() => {
    if (!selectedRole) return
    let isMounted = true
    const fetchMatrix = async () => {
      setIsLoadingMatrix(true)
      try {
        const res = await PermissionService.getRoleMatrix(selectedRole)
        const dbMatrix = res?.data?.data
        const fallbackMatrix = (roleActionPermissions as any)[selectedRole] || {}
        const sourceMatrix = (dbMatrix && typeof dbMatrix === 'object') ? dbMatrix : fallbackMatrix

        const filled: Record<string, Record<string, boolean>> = {}
        CONFIGURABLE_MODULES.forEach(m => {
          filled[m] = {}
          ALL_ACTIONS.forEach(a => { 
            filled[m][a] = sourceMatrix[m]?.[a] ?? false 
          })
        })
        if (isMounted) setPermissionMatrix(filled)
      } catch (err) {
        const fallbackMatrix = (roleActionPermissions as any)[selectedRole] || {}
        const filled: Record<string, Record<string, boolean>> = {}
        CONFIGURABLE_MODULES.forEach(m => {
          filled[m] = {}
          ALL_ACTIONS.forEach(a => { 
            filled[m][a] = fallbackMatrix[m]?.[a] ?? false 
          })
        })
        if (isMounted) setPermissionMatrix(filled)
      } finally {
        if (isMounted) setIsLoadingMatrix(false)
      }
    }
    fetchMatrix()
    return () => { isMounted = false }
  }, [selectedRole, roleActionPermissions])

  // Load user matrix when selectedUserId changes
  React.useEffect(() => {
    if (!selectedUserId) return
    let isMounted = true
    const fetchUserMatrix = async () => {
      setIsLoadingMatrix(true)
      try {
        const selectedUser = usersList.find(u => u.id === selectedUserId)
        const userRole = selectedUser?.role || "Teams"
        
        const res = await PermissionService.getUserMatrix(selectedUserId)
        const dbUserMatrix = res?.data?.data
        
        const roleMatrix = (roleActionPermissions as any)[userRole] || {}
        const sourceMatrix = (dbUserMatrix && typeof dbUserMatrix === 'object') ? dbUserMatrix : roleMatrix

        const filled: Record<string, Record<string, boolean>> = {}
        CONFIGURABLE_MODULES.forEach(m => {
          filled[m] = {}
          ALL_ACTIONS.forEach(a => { 
            filled[m][a] = sourceMatrix[m]?.[a] ?? false 
          })
        })
        if (isMounted) setUserPermissionMatrix(filled)
      } catch (err) {
        const selectedUser = usersList.find(u => u.id === selectedUserId)
        const userRole = selectedUser?.role || "Teams"
        const roleMatrix = (roleActionPermissions as any)[userRole] || {}
        const filled: Record<string, Record<string, boolean>> = {}
        CONFIGURABLE_MODULES.forEach(m => {
          filled[m] = {}
          ALL_ACTIONS.forEach(a => { 
            filled[m][a] = roleMatrix[m]?.[a] ?? false 
          })
        })
        if (isMounted) setUserPermissionMatrix(filled)
      } finally {
        if (isMounted) setIsLoadingMatrix(false)
      }
    }
    fetchUserMatrix()
    return () => { isMounted = false }
  }, [selectedUserId, usersList, roleActionPermissions])

  const handlePermissionToggle = (module: string, action: string) => {
    setPermissionMatrix(prev => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module]?.[action] }
    }))
  }

  const handleUserPermissionToggle = (module: string, action: string) => {
    setUserPermissionMatrix(prev => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module]?.[action] }
    }))
  }

  const handleToggleRow = (module: string, currentMatrix: Record<string, Record<string, boolean>>, isUser = false) => {
    const row = currentMatrix[module] || {}
    const allChecked = ALL_ACTIONS.every(a => row[a])
    const newRow: Record<string, boolean> = {}
    ALL_ACTIONS.forEach(a => { newRow[a] = !allChecked })

    if (isUser) {
      setUserPermissionMatrix(prev => ({ ...prev, [module]: newRow }))
    } else {
      setPermissionMatrix(prev => ({ ...prev, [module]: newRow }))
    }
  }

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return
    setIsSaving(true)
    try {
      const typed: Record<string, ModuleActionFlags> = {}
      Object.keys(permissionMatrix).forEach(m => { 
        typed[m] = {
          view: !!permissionMatrix[m]?.view,
          add: !!permissionMatrix[m]?.add,
          edit: !!permissionMatrix[m]?.edit,
          delete: !!permissionMatrix[m]?.delete,
        }
      })

      await executeWithFeedback(async () => { 
        await PermissionService.saveRoleMatrix(selectedRole, typed)
        setRoleAllModuleActions(selectedRole as any, typed)
        await fetchRolePermissions()
      }, {
        actionType: "update", 
        successTitle: "Role Permissions Saved", 
        successMsg: `Matrix updated and persisted to DB for role "${selectedRole}".`
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveUserPermissions = async () => {
    if (!selectedUserId) return
    setIsSaving(true)
    try {
      const typed: Record<string, ModuleActionFlags> = {}
      Object.keys(userPermissionMatrix).forEach(m => { 
        typed[m] = {
          view: !!userPermissionMatrix[m]?.view,
          add: !!userPermissionMatrix[m]?.add,
          edit: !!userPermissionMatrix[m]?.edit,
          delete: !!userPermissionMatrix[m]?.delete,
        }
      })

      const selectedUser = usersList.find(u => u.id === selectedUserId)
      const userLabel = selectedUser ? `${selectedUser.name} (${selectedUser.email})` : selectedUserId

      await executeWithFeedback(async () => { 
        await PermissionService.saveUserMatrix(selectedUserId, typed)
        if (selectedUser?.email) {
          await PermissionService.saveUserMatrix(selectedUser.email, typed)
        }
        setUserAllModuleActions(selectedUserId, typed)
        if (selectedUser?.email) {
          setUserAllModuleActions(selectedUser.email, typed)
        }
        await fetchUserPermissions(selectedUserId)
      }, {
        actionType: "update", 
        successTitle: "User Permissions Saved", 
        successMsg: `Custom permission overrides saved for ${userLabel}.`
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetUserToRoleDefaults = () => {
    const selectedUser = usersList.find(u => u.id === selectedUserId)
    const userRole = selectedUser?.role || "Teams"
    const roleMatrix = (roleActionPermissions as any)[userRole] || {}
    const filled: Record<string, Record<string, boolean>> = {}
    CONFIGURABLE_MODULES.forEach(m => {
      filled[m] = {}
      ALL_ACTIONS.forEach(a => { 
        filled[m][a] = roleMatrix[m]?.[a] ?? false 
      })
    })
    setUserPermissionMatrix(filled)
  }

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return
    const data = { name: formName, description: formDescription }
    await executeWithFeedback(async () => {
      if (editingRole) { 
        await PermissionService.updateCustomRole(editingRole.id, data) 
      } else { 
        await PermissionService.createCustomRole(data) 
      }
    }, { 
      actionType: editingRole ? "update" : "create", 
      successTitle: editingRole ? "Role Updated" : "Role Created" 
    })
    setIsRoleModalOpen(false)
    loadRoles()
  }

  const handleDeleteRole = async () => {
    if (!deleteConfirm) return
    await executeWithFeedback(async () => { 
      await PermissionService.deleteCustomRole(deleteConfirm.id) 
    }, { actionType: "delete", successTitle: "Role Deleted" })
    setDeleteConfirm(null)
    loadRoles()
  }

  const selectedUserData = visibleUsersList.find(u => u.id === selectedUserId) || usersList.find(u => u.id === selectedUserId)

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Shield className="text-blue-600 dark:text-blue-400" size={24} />
            <span>Permissions & Access Control</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Centralized role-based access control (RBAC) and per-user permission overrides persisted to database
          </p>
        </div>
        {activeTab === "custom-roles" && (
          <button 
            onClick={() => { setEditingRole(null); setFormName(""); setFormDescription(""); setIsRoleModalOpen(true) }} 
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Custom Role</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px overflow-x-auto">
        {(["roles", "permissions", "user-permissions", "custom-roles"] as Tab[]).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab 
                ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20" 
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            {tab === "roles" && <Lock size={14} />}
            {tab === "permissions" && <Shield size={14} />}
            {tab === "user-permissions" && <UserCheck size={14} />}
            {tab === "custom-roles" && <Sparkles size={14} />}
            <span className="capitalize">{tab === "user-permissions" ? "Per-User Permissions" : tab.replace("-", " ")}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Roles Overview */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEFAULT_ROLES.map(role => (
              <div key={role.name} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">
                  <Lock size={18} />
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{role.name}</h3>
                <p className="text-[11px] text-zinc-500 mb-3 line-clamp-2">{role.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-semibold text-blue-600">{role.permissionCount} checks</span>
                  <button 
                    onClick={() => { setSelectedRole(role.name); setActiveTab("permissions") }}
                    className="text-[11px] font-semibold text-zinc-600 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Configure →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3">
            <Shield className="shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-semibold">Centralized Access System Active</p>
              <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                All role permission configurations and user-level overrides are synchronized directly with MySQL database and propagate to all active user sessions instantly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Role Permission Matrix */}
      {activeTab === "permissions" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Configuring Role:</label>
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)} 
                className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Select a role</option>
                {["Super Admin", "Admin", "Teams", "Clients", ...customRoles.map(r => r.name)].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {selectedRole && (
              <button 
                onClick={handleSaveRolePermissions} 
                disabled={isSaving || isLoadingMatrix}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save Role Matrix</span>
              </button>
            )}
          </div>

          {selectedRole && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
              {isLoadingMatrix ? (
                <div className="p-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span className="text-xs">Loading matrix permissions from DB...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Module</th>
                        <th className="py-3 px-2 text-center">Toggle All</th>
                        {ALL_ACTIONS.map(a => (
                          <th key={a} className="py-3 px-3 text-center capitalize">{a}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                      {CONFIGURABLE_MODULES.map(mod => {
                        const isAllChecked = ALL_ACTIONS.every(a => permissionMatrix[mod]?.[a])
                        return (
                          <tr key={mod} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                              {mod}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleRow(mod, permissionMatrix, false)}
                                className={`text-[10px] px-2 py-0.5 rounded font-medium border transition-colors cursor-pointer ${
                                  isAllChecked 
                                    ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400" 
                                    : "bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700"
                                }`}
                              >
                                {isAllChecked ? "Clear" : "All"}
                              </button>
                            </td>
                            {ALL_ACTIONS.map(a => {
                              const checked = !!permissionMatrix[mod]?.[a]
                              return (
                                <td key={a} className="py-3 px-3 text-center">
                                  <button 
                                    type="button"
                                    onClick={() => handlePermissionToggle(mod, a)} 
                                    className={`w-6 h-6 mx-auto rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                      checked 
                                        ? "bg-blue-600 border-blue-600 text-white shadow-xs" 
                                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-transparent hover:border-blue-400"
                                    }`}
                                  >
                                    {checked && <Check size={12} strokeWidth={3} />}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-[11px] text-zinc-500">Changes take effect immediately on next user action.</span>
                <button 
                  onClick={handleSaveRolePermissions} 
                  disabled={isSaving || isLoadingMatrix}
                  className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Permissions"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Per-User Permission Overrides */}
      {activeTab === "user-permissions" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Select User:</label>
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)} 
                  className="w-full sm:w-80 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select a user account</option>
                  {visibleUsersList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) — {u.email}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUserData && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleResetUserToRoleDefaults} 
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                    title="Reset matrix to user's default role permissions"
                  >
                    <RotateCcw size={13} />
                    <span>Reset to Role Defaults</span>
                  </button>
                  <button 
                    onClick={handleSaveUserPermissions} 
                    disabled={isSaving || isLoadingMatrix}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save User Overrides</span>
                  </button>
                </div>
              )}
            </div>

            {selectedUserData && (
              <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <span className="text-zinc-500">Name: <strong className="text-zinc-900 dark:text-zinc-100">{selectedUserData.name}</strong></span>
                <span className="text-zinc-500">Email: <strong className="text-zinc-900 dark:text-zinc-100">{selectedUserData.email}</strong></span>
                <span className="text-zinc-500">Base Role: <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold text-[10px]">{selectedUserData.role}</span></span>
                <span className="text-zinc-500">Status: <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 font-bold text-[10px]">{selectedUserData.status || "Active"}</span></span>
              </div>
            )}
          </div>

          {selectedUserId && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
              {isLoadingMatrix ? (
                <div className="p-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span className="text-xs">Loading user permission overrides...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Module</th>
                        <th className="py-3 px-2 text-center">Toggle All</th>
                        {ALL_ACTIONS.map(a => (
                          <th key={a} className="py-3 px-3 text-center capitalize">{a}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                      {CONFIGURABLE_MODULES.map(mod => {
                        const isAllChecked = ALL_ACTIONS.every(a => userPermissionMatrix[mod]?.[a])
                        return (
                          <tr key={mod} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                              {mod}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleRow(mod, userPermissionMatrix, true)}
                                className={`text-[10px] px-2 py-0.5 rounded font-medium border transition-colors cursor-pointer ${
                                  isAllChecked 
                                    ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400" 
                                    : "bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700"
                                }`}
                              >
                                {isAllChecked ? "Clear" : "All"}
                              </button>
                            </td>
                            {ALL_ACTIONS.map(a => {
                              const checked = !!userPermissionMatrix[mod]?.[a]
                              return (
                                <td key={a} className="py-3 px-3 text-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleUserPermissionToggle(mod, a)} 
                                    className={`w-6 h-6 mx-auto rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                      checked 
                                        ? "bg-blue-600 border-blue-600 text-white shadow-xs" 
                                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-transparent hover:border-blue-400"
                                    }`}
                                  >
                                    {checked && <Check size={12} strokeWidth={3} />}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-[11px] text-zinc-500">User overrides take highest priority over role defaults.</span>
                <button 
                  onClick={handleSaveUserPermissions} 
                  disabled={isSaving || isLoadingMatrix}
                  className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save User Overrides"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Custom Roles */}
      {activeTab === "custom-roles" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Role Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Assigned Permissions</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {customRoles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400">
                    No custom roles defined yet. Click "Add Custom Role" to create one.
                  </td>
                </tr>
              ) : (
                customRoles.map(role => (
                  <tr key={role.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{role.name}</td>
                    <td className="py-3 px-4 text-zinc-500">{role.description || "-"}</td>
                    <td className="py-3 px-4">{role.permissionCount || 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setEditingRole(role); setFormName(role.name); setFormDescription(role.description || ""); setIsRoleModalOpen(true) }} 
                          className="p-1 hover:text-blue-600 rounded cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(role)} 
                          className="p-1 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Custom Role Modal */}
      <AnimatePresence>
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-sm">{editingRole ? "Edit" : "Add"} Custom Role</h3>
                <button onClick={() => setIsRoleModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmitRole} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Role Name *</label>
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500" placeholder="e.g. Account Manager" />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Description</label>
                  <textarea rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden" placeholder="Describe role responsibilities..." />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer">{editingRole ? "Update" : "Create"}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="font-bold text-sm">Delete Custom Role</h3>
              <p className="text-xs text-zinc-500">Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs text-zinc-500 font-semibold cursor-pointer">Cancel</button>
                <button onClick={handleDeleteRole} className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
