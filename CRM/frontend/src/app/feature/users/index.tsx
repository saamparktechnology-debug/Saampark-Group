"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Users as UsersIcon, UserPlus, ShieldCheck, UserCheck, Briefcase, Download, Lock } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { UserItem } from "./types"
import { getUsers, recordUserAccount, deleteUser } from "./services/userService"
import { saveModuleDataToDB } from "@/lib/storageSync"
import { UserList } from "./components/UserList"
import { UserModal } from "./components/UserModal"
import { ModulePermissionsModal } from "./components/ModulePermissionsModal"
import { CompanyModal } from "./components/CompanyModal"

import { usePermissionStore } from "@/store/usePermissionStore"

export default function UsersMain() {
  const { activeCompanyId, user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddUser = user?.role === "Super Admin" || canPerformAction(user, "Users", "add")

  // ── Access Guard: Only Super Admin and Admin can access User Management ──
  if (user && user.role !== "Super Admin" && user.role !== "Admin") {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-10 rounded-3xl border border-border shadow-xl space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            User Management is only accessible to Administrators and Super Admins. Please contact your administrator if you require changes to your account.
          </p>
          <p className="text-xs text-muted-foreground/60">Your role: <strong className="text-primary">{user.role}</strong></p>
        </motion.div>
      </div>
    )
  }
  const [users, setUsers] = React.useState<UserItem[]>([])
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = React.useState(false)
  const [isCompanyModalOpen, setIsCompanyModalOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserItem | null>(null)

  const isSuperAdminLoggedIn = user?.role === "Super Admin"

  const loadUsers = React.useCallback(async () => {
    const list = await getUsers(isSuperAdminLoggedIn ? "all" : (activeCompanyId || "all"))
    setUsers(list)
  }, [activeCompanyId, isSuperAdminLoggedIn])

  React.useEffect(() => {
    loadUsers()

    const handleStorageChange = () => {
      loadUsers()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("saampark_company_switched", handleStorageChange)
    const interval = setInterval(loadUsers, 2500)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("saampark_company_switched", handleStorageChange)
      clearInterval(interval)
    }
  }, [loadUsers])

  // Super Admin users are only visible when logged in as Super Admin
  const visibleUsers = React.useMemo(() => {
    if (isSuperAdminLoggedIn) return users
    return users.filter((u) => u.role !== "Super Admin")
  }, [users, isSuperAdminLoggedIn])

  // Metric counts based on visible users
  const totalUsers = visibleUsers.length
  const totalAdmins = visibleUsers.filter((u) => u.role === "Super Admin" || u.role === "Admin").length
  const totalTeams = visibleUsers.filter((u) => u.role === "Teams").length
  const totalClients = visibleUsers.filter((u) => u.role === "Clients").length

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
    const isNew = !editingUser
    let realId = editingUser?.id ? String(editingUser.id) : ""

    try {
      const { api } = await import("@/lib/api")
      const roleIdMap: Record<string, number> = {
        "Super Admin": 1,
        "Admin": 2,
        "Teams": 3,
        "User": 3,
        "Clients": 4,
      }
      const role_id = roleIdMap[userData.role || ""] || 3

      if (!editingUser && userData.email) {
        const res: any = await api.post("/users", {
          full_name: userData.name || "User Account",
          email: userData.email,
          password: userData.password || "Password123",
          role_id,
          role: userData.role,
          company_id: userData.companyId || (userData.companyIds && userData.companyIds[0]) || "tech",
          company_ids: userData.companyIds || (userData.companyId ? [userData.companyId] : ["tech"]),
          department: userData.department || "General",
          phone: userData.phone || "",
          permissions: (userData as any).permissions,
        }).catch((err) => {
          console.warn("Backend user create warning:", err)
          return null
        })

        if (res?.data?.id || res?.id) {
          realId = String(res?.data?.id || res?.id)
        }
      } else if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          full_name: userData.name,
          email: userData.email || editingUser.email,
          phone: userData.phone,
          status: userData.status?.toLowerCase(),
          role_id,
          company_id: userData.companyId || (userData.companyIds && userData.companyIds[0]),
          company_ids: userData.companyIds,
          department: userData.department,
          permissions: (userData as any).permissions,
        }).catch((err) => console.warn("Backend user update warning:", err))
      }
    } catch (e) {
      console.warn("API sync silent fail:", e)
    }

    const saved = recordUserAccount(
      {
        ...userData,
        id: realId || userData.id,
        companyIds: userData.companyIds || (userData.companyId ? [userData.companyId] : ["tech"]),
        permissions: (userData as any).permissions,
      },
      isNew
    )

    if (!saved) return

    // If the currently logged-in user's name or companies were updated, update auth store immediately
    const currentUser = useAuthStore.getState().user
    if (currentUser && (currentUser.email.toLowerCase().trim() === saved.email.toLowerCase().trim() || String(currentUser.id) === String(saved.id))) {
      useAuthStore.setState({
        user: {
          ...currentUser,
          name: saved.name,
          companyIds: saved.companyIds,
          companyId: (saved.companyIds && saved.companyIds[0]) || saved.companyId || currentUser.companyId,
          phone: saved.phone || currentUser.phone,
        }
      })
    }

    setUsers((prev) => {
      let nextList: UserItem[] = []
      if (editingUser) {
        nextList = prev.map((u) =>
          u.id === editingUser.id || u.email.toLowerCase().trim() === saved.email.toLowerCase().trim()
            ? ({ ...u, ...saved, role: userData.role || saved.role, permissions: (userData as any).permissions } as UserItem)
            : u
        )
      } else {
        nextList = [saved, ...prev.filter((u) => u.email.toLowerCase().trim() !== saved.email.toLowerCase().trim())]
      }
      saveModuleDataToDB("users", nextList, "all")
      if (typeof window !== "undefined") {
        try { localStorage.setItem("saampark_registered_accounts", JSON.stringify(nextList)); } catch {}
        window.dispatchEvent(new Event("storage"))
      }
      return nextList
    })

    // Immediate re-fetch from database to ensure newly created user displays cleanly
    setTimeout(() => {
      loadUsers()
    }, 100)
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const { UserService } = await import("@/services/apiServices")
      await UserService.toggleStatus(id).catch((err) => console.warn("Status toggle warning:", err))
    } catch {}

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


  const handleDeleteUser = async (id: string) => {
    const targetUser = users.find((u) => u.id === id)
    if (targetUser) {
      await deleteUser(id, targetUser.email)
    } else {
      await deleteUser(id)
    }
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
          {user?.role === "Super Admin" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompanyModalOpen(true)}
              className="gap-2 border-purple-500/40 text-purple-400 hover:bg-purple-500/10 cursor-pointer"
            >
              🏢 Create Company
            </Button>
          )}

          {canConfigureModulePermissions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPermissionsModalOpen(true)}
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <Lock size={16} /> Module Permissions
            </Button>
          )}

          <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
            <Download size={16} /> Export CSV
          </Button>

          {canAddUser && (
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="gap-2 cursor-pointer">
              <UserPlus size={16} /> Add New User
            </Button>
          )}
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
        users={visibleUsers}
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

      {/* Super Admin Create Company Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />
    </motion.div>
  )
}
