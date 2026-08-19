"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Users as UsersIcon, UserPlus, ShieldCheck, UserCheck, Briefcase, Download, Lock } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { UserItem } from "./types"
import { getUsers, recordUserAccount } from "./services/userService"
import { UserList } from "./components/UserList"
import { UserModal } from "./components/UserModal"
import { ModulePermissionsModal } from "./components/ModulePermissionsModal"

export default function UsersMain() {
  const { activeCompanyId, user } = useAuthStore()
  const [users, setUsers] = React.useState<UserItem[]>([])
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserItem | null>(null)

  const loadUsers = React.useCallback(async () => {
    const list = await getUsers(activeCompanyId || "all")
    setUsers(list)
  }, [activeCompanyId])

  React.useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Metric counts
  const totalUsers = users.length
  const totalAdmins = users.filter((u) => u.role === "Super Admin" || u.role === "Admin").length
  const totalTeams = users.filter((u) => u.role === "Teams" || u.role === "User").length
  const totalClients = users.filter((u) => u.role === "Clients").length

  const canConfigureModulePermissions = user?.role === "Super Admin" || user?.role === "Admin"

  const handleOpenCreateModal = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (userItem: UserItem) => {
    setEditingUser(userItem)
    setIsModalOpen(true)
  }

  const handleSaveUser = async (userData: Partial<UserItem>) => {
    const saved = recordUserAccount(userData)
    
    // Background sync attempt
    try {
      if (!editingUser && userData.email) {
        const { AuthService } = await import("@/services/apiServices")
        await AuthService.register({
          email: userData.email,
          password: "Password123!",
          full_name: userData.name || "User",
          role: userData.role,
        }).catch((err) => console.warn("Backend register call attempt:", err))
      }
    } catch (e) {
      console.warn("API sync silent fail:", e)
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? ({ ...u, ...saved } as UserItem) : u))
      )
    } else {
      setUsers((prev) => [saved, ...prev.filter((u) => u.email.toLowerCase() !== saved.email.toLowerCase())])
    }
  }

  const handleToggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === "Active" ? "Inactive" : "Active"
          return { ...u, status: nextStatus }
        }
        return u
      })
    )
  }

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <UsersIcon className="text-primary" size={32} />
            Users Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, system permissions, role access, and dynamic module visibility across SAAMPARK Group.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canConfigureModulePermissions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPermissionsModalOpen(true)}
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
            >
              <Lock size={16} /> Module Permissions
            </Button>
          )}

          <Button variant="outline" size="sm" className="gap-2">
            <Download size={16} /> Export CSV
          </Button>

          <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="gap-2">
            <UserPlus size={16} /> Add New User
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Users</div>
            <div className="text-2xl font-bold text-foreground mt-1">{totalUsers}</div>
            <div className="text-xs text-emerald-400 mt-1">Active Accounts</div>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <UsersIcon size={24} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admins & Leadership</div>
            <div className="text-2xl font-bold text-foreground mt-1">{totalAdmins}</div>
            <div className="text-xs text-purple-400 mt-1">Full System Access</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teams & Users</div>
            <div className="text-2xl font-bold text-foreground mt-1">{totalTeams}</div>
            <div className="text-xs text-blue-400 mt-1">Teams & General Users</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Accounts</div>
            <div className="text-2xl font-bold text-foreground mt-1">{totalClients}</div>
            <div className="text-xs text-amber-400 mt-1">Portal Users</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Briefcase size={24} />
          </div>
        </div>
      </div>

      {/* Users Table Component */}
      <UserList
        users={users}
        onEdit={handleOpenEditModal}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteUser}
      />

      {/* User Create/Edit Modal with Custom Module Access */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />

      {/* Role-Level Module Access Control Modal */}
      <ModulePermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />
    </motion.div>
  )
}
