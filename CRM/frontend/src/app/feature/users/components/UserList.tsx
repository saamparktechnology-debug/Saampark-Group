"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Search, Filter, Shield, Edit2, Trash2, CheckCircle2, XCircle, Clock, Building2, Mail, Phone, Lock } from "lucide-react"
import { UserItem, UserRole, UserStatus } from "../types"
import { usePermissionStore } from "@/store/usePermissionStore"
import { useAuthStore } from "@/store/useAuthStore"

interface UserListProps {
  users: UserItem[]
  onEdit: (user: UserItem) => void
  onToggleStatus: (id: string) => void
  onDelete: (id: string) => void
  onManageUserModules?: (user: UserItem) => void
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

export function UserList({ users, onEdit, onToggleStatus, onDelete, onManageUserModules }: UserListProps) {
  const { user: currentUser } = useAuthStore()
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
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[u.role] || ROLE_COLORS.Teams}`}>
                          <Shield size={12} />
                          {u.role}
                        </span>
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

                      {/* Company & Dept */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Building2 size={13} className="text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[180px]">{u.companyName || (u.companyId === 'digital' ? 'SAAMPARK Digital' : 'SAAMPARK Tech')}</span>
                        </div>
                        {u.companyIds && u.companyIds.length > 1 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {u.companyIds.map(cId => (
                              <span key={cId} className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-surface-pressed border border-border text-muted-foreground">
                                {cId}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-0.5">{u.department || "General"}</div>
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
