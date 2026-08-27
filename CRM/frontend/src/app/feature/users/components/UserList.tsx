"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Search, Filter, Shield, Edit2, Trash2, CheckCircle2, XCircle, Clock, Building2, Mail, Phone, Lock, MapPin } from "lucide-react"
import { UserItem, UserRole, UserStatus } from "../types"
import { usePermissionStore } from "@/store/usePermissionStore"
import { useAuthStore } from "@/store/useAuthStore"

interface UserListProps {
  users: UserItem[]
  onEdit: (user: UserItem) => void
  onToggleStatus: (id: string) => void
  onDelete: (id: string) => void
  onManageUserModules?: (user: UserItem) => void
  onViewOverview?: (user: UserItem) => void
}

const ROLE_COLORS: Record<UserRole, string> = {
  "Super Admin": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Admin": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Teams": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Clients": "bg-amber-500/10 text-amber-400 border-amber-500/20",
}

const STATUS_ICONS: Record<UserStatus, React.ReactNode> = {
  "Active": <CheckCircle2 size={14} className="text-emerald-400" />,
  "Inactive": <XCircle size={14} className="text-rose-400" />,
  "Pending": <Clock size={14} className="text-amber-400" />,
}

export function UserList({ users, onEdit, onToggleStatus, onDelete, onManageUserModules, onViewOverview }: UserListProps) {
  const { user: currentUser, companies } = useAuthStore()
  const { getModulesForUser, canPerformAction } = usePermissionStore()

  const isSuperAdmin = currentUser?.role === "Super Admin"
  const canEditUsers = isSuperAdmin || canPerformAction(currentUser, "Users", "edit")
  const canDeleteUsers = isSuperAdmin || canPerformAction(currentUser, "Users", "delete")

  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedRole, setSelectedRole] = React.useState<string>("All")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("All")

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesRole = selectedRole === "All" || u.role === selectedRole
      const matchesStatus = selectedStatus === "All" || u.status === selectedStatus

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, selectedRole, selectedStatus])

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 rounded-xl border border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name, email, or department..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="All">All Roles</option>
              {isSuperAdmin && <option value="Super Admin">Super Admin</option>}
              <option value="Admin">Admin</option>
              <option value="Teams">Teams</option>
              <option value="Clients">Clients</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-surface/50 text-xs font-semibold text-muted-foreground">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Account Module Access</th>
                <th className="py-3.5 px-4">Company & Dept</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No users matching the criteria found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const allowedMods = getModulesForUser({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role as any,
                    companyId: u.companyId as any,
                    avatar: "",
                  })

                  return (
                    <tr key={u.id} className="hover:bg-surface-hover/40 transition-colors group">
                      {/* User (Click to open Overview) */}
                      <td 
                        className="py-3.5 px-4 cursor-pointer"
                        onClick={() => onViewOverview?.(u)}
                        title="Click to view complete account overview and KYC details"
                      >
                        <div className="flex items-center gap-3 group/user">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover border border-border shadow-2xs shrink-0 group-hover/user:ring-2 group-hover/user:ring-primary transition-all"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0 group-hover/user:ring-2 group-hover/user:ring-primary transition-all">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-foreground group-hover/user:text-primary transition-colors flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.kycStatus === "Verified" && (
                                <span className="text-[10px] text-emerald-500 font-bold" title="KYC Verified">✓</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[u.role] || ROLE_COLORS.Teams}`}>
                            <Shield size={12} />
                            {u.role}
                          </span>
                          {u.kycStatus && u.kycStatus !== "Pending" && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              u.kycStatus === "Verified"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : u.kycStatus === "Processing"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            }`}>
                              KYC: {u.kycStatus}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Account Module Access */}
                      <td className="py-3.5 px-4">
                        {u.role === "Super Admin" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            👑 Full Master Access
                          </span>
                        ) : canEditUsers ? (
                          <button
                            type="button"
                            onClick={() => onEdit(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors shadow-2xs cursor-pointer"
                            title="Click to customize module permissions for this account"
                          >
                            <Lock size={12} />
                            <span>{allowedMods.length} Module{allowedMods.length === 1 ? "" : "s"} Allowed</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-surface border border-border text-muted-foreground">
                            <Lock size={12} />
                            <span>{allowedMods.length} Module{allowedMods.length === 1 ? "" : "s"} Allowed</span>
                          </span>
                        )}
                      </td>

                      {/* Company & Branch Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {(() => {
                            const activeUserCompanyIds = (u.companyIds && u.companyIds.length > 0
                              ? u.companyIds
                              : (u.companyId ? [u.companyId] : [])
                            ).filter(cId => {
                              const norm = String(cId).toLowerCase().trim()
                              return companies.some(c => 
                                String(c.id).toLowerCase().trim() === norm || 
                                String(c.slug || "").toLowerCase().trim() === norm
                              )
                            })

                            if (activeUserCompanyIds.length > 1) {
                              return (
                                <div className="flex flex-wrap gap-1 max-w-[220px]">
                                  {activeUserCompanyIds.map((cId) => {
                                    const match = companies.find(c => 
                                      String(c.id).toLowerCase().trim() === String(cId).toLowerCase().trim() ||
                                      String(c.slug || "").toLowerCase().trim() === String(cId).toLowerCase().trim()
                                    )
                                    const codeOrShort = (match as any)?.code || (cId === "digital" ? "Digital" : cId === "tech" ? "Technology" : match?.name || cId)
                                    const icon = (cId === "digital" || match?.slug === "digital") ? "📈" : "💻"
                                    return (
                                      <span
                                        key={cId}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                                      >
                                        <span>{icon}</span>
                                        <span>{codeOrShort}</span>
                                      </span>
                                    )
                                  })}
                                </div>
                              )
                            }

                            const primaryId = activeUserCompanyIds[0] || u.companyId || (companies[0]?.id || "tech")
                            const matchedCompany = companies.find(c => 
                              String(c.id).toLowerCase().trim() === String(primaryId).toLowerCase().trim() ||
                              String(c.slug || "").toLowerCase().trim() === String(primaryId).toLowerCase().trim()
                            )
                            const displayName = matchedCompany?.name || u.companyName || (primaryId === 'digital' ? 'SAAMPARK Digital' : 'SAAMPARK Technology')

                            return (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 w-fit">
                                <Building2 size={11} className="shrink-0" />
                                <span className="truncate max-w-[160px]">{displayName}</span>
                              </div>
                            )
                          })()}
                          
                          {/* Branch Badge (only shown when assigned to a specific branch) */}
                          {(u.branchName || u.branchId) && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 w-fit">
                              <MapPin size={10} className="text-amber-500 shrink-0" />
                              <span>{u.branchName || `Branch (${u.branchId})`}</span>
                            </div>
                          )}

                          {u.department && (
                            <span className="text-[10px] text-muted-foreground ml-0.5">{u.department}</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => canEditUsers && onToggleStatus(u.id)}
                          disabled={!canEditUsers}
                          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border border-border transition-colors ${canEditUsers ? "hover:bg-surface-hover cursor-pointer" : "opacity-70 cursor-not-allowed"}`}
                        >
                          {STATUS_ICONS[u.status]}
                          <span>{u.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEditUsers && (
                            <button
                              onClick={() => onEdit(u)}
                              title="Edit User Account & Module Access"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDeleteUsers && u.role !== "Super Admin" && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete user "${u.name}" (${u.email})?\n\nThis account will be permanently deleted and will no longer be able to log in.`)) {
                                  onDelete(u.id)
                                }
                              }}
                              title="Delete User"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
