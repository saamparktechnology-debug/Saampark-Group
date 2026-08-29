"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users as UsersIcon, UserPlus, ShieldCheck, UserCheck, Briefcase, Download, Lock, CheckCircle2, AlertTriangle, X, Mail, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { UserItem, UserStatus } from "./types"
import { getUsers, recordUserAccount, deleteUser } from "./services/userService"
import { saveModuleDataToDB } from "@/lib/storageSync"
import { UserList } from "./components/UserList"
import { UserModal } from "./components/UserModal"
import { UserOverviewModal } from "./components/UserOverviewModal"
import { ModulePermissionsModal } from "./components/ModulePermissionsModal"

import { usePermissionStore } from "@/store/usePermissionStore"
import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"

export default function UsersMain() {
  const { activeCompanyId, activeBranchId, branches, user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddUser = user?.role === "Super Admin" || canPerformAction(user, "Users", "add")

  const [users, setUsers] = React.useState<UserItem[]>([])
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserItem | null>(null)
  const [selectedUserForOverview, setSelectedUserForOverview] = React.useState<UserItem | null>(null)
  const [isOverviewModalOpen, setIsOverviewModalOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Success / Failure Feedback Popup Modal State
  const [statusModalState, setStatusModalState] = React.useState<{
    isOpen: boolean
    type: "success" | "failed"
    title: string
    message: string
    details?: { oldEmail?: string; newEmail?: string }
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  })

  const isSuperAdminLoggedIn = user?.role === "Super Admin"

  const loadUsers = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const list = await getUsers("all")
      setUsers(list || [])
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadUsers(true)

    const handleStorageChange = () => {
      loadUsers(false)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("saampark_company_switched", handleStorageChange)
    window.addEventListener("saampark_branch_switched", handleStorageChange)
    window.addEventListener("saampark_data_synced", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("saampark_company_switched", handleStorageChange)
      window.removeEventListener("saampark_branch_switched", handleStorageChange)
      window.removeEventListener("saampark_data_synced", handleStorageChange)
    }
  }, [loadUsers])

  // Strictly isolate visible users based on active company and active branch
  const isClientRole = user?.role === "Clients" || (user?.role as string) === "Client"
  const visibleUsers = React.useMemo(() => {
    if (isClientRole && user) {
      const uId = String(user.id || "").toLowerCase().trim()
      const uEmail = (user.email || "").toLowerCase().trim()
      return users.filter((u) => {
        const uid = String(u.id || "").toLowerCase().trim()
        const uClientId = String((u as any).clientId || (u as any).createdById || "").toLowerCase().trim()
        const uClientEmail = String((u as any).clientEmail || (u as any).createdByEmail || "").toLowerCase().trim()
        return (uid === uId) || (uId && uClientId === uId) || (uEmail && uClientEmail === uEmail)
      })
    }

    const targetComp = (activeCompanyId || user?.companyId || "").toLowerCase().trim()
    const targetBranch = activeBranchId

    let filtered = users
    if (!isSuperAdminLoggedIn) {
      filtered = filtered.filter((u) => u.role !== "Super Admin")

      if (targetComp && targetComp !== "all") {
        filtered = filtered.filter((u) => {
          const uCompIds = (u.companyIds && u.companyIds.length > 0)
            ? u.companyIds.map(id => String(id).toLowerCase().trim())
            : [String(u.companyId || "tech").toLowerCase().trim()]
          return uCompIds.includes(targetComp)
        })
      }

      if (targetBranch) {
        const targetBranchObj = branches.find(b => b.id === targetBranch || b.name.toLowerCase() === targetBranch.toLowerCase())
        const targetBranchId = String(targetBranchObj?.id || targetBranch).toLowerCase().trim()
        const targetBranchName = targetBranchObj?.name?.toLowerCase().trim() || ""

        filtered = filtered.filter((u) => {
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
    }

    return filtered.length > 0 ? filtered : users
  }, [users, isSuperAdminLoggedIn, isClientRole, user, activeCompanyId, activeBranchId, branches])

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

    const oldEmail = editingUser?.email?.toLowerCase().trim() || ""
    const newEmail = userData.email?.toLowerCase().trim() || ""
    const isEmailTransfer = Boolean(
      editingUser &&
      oldEmail &&
      newEmail &&
      oldEmail !== newEmail
    )

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
          branch_id: userData.branchId || null,
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
          branch_id: userData.branchId || null,
          department: userData.department,
          permissions: (userData as any).permissions,
        }).catch((err) => console.warn("Backend user update warning:", err))
      }
    } catch (e) {
      console.warn("API sync silent fail:", e)
    }

    // Preserve previous emails history for dual login capability
    const prevEmailsList: string[] = Array.isArray(editingUser?.previousEmails)
      ? [...editingUser.previousEmails]
      : (editingUser?.previousEmail ? [editingUser.previousEmail] : [])

    if (isEmailTransfer && oldEmail) {
      if (!prevEmailsList.includes(oldEmail)) {
        prevEmailsList.push(oldEmail)
      }
      try {
        const { markGlobalItemDeleted, unmarkGlobalItemDeleted } = await import("@/lib/storageSync")
        await markGlobalItemDeleted(oldEmail, "users")
        if (newEmail) unmarkGlobalItemDeleted(newEmail)
      } catch {}
    } else if (newEmail) {
      try {
        const { unmarkGlobalItemDeleted } = await import("@/lib/storageSync")
        unmarkGlobalItemDeleted(newEmail)
      } catch {}
    }

    const { recordUserAccountAsync } = await import("./services/userService")
    const saved = await recordUserAccountAsync(
      {
        ...userData,
        id: realId || userData.id,
        companyIds: userData.companyIds || (userData.companyId ? [userData.companyId] : ["tech"]),
        permissions: (userData as any).permissions,
        previousEmails: prevEmailsList.length > 0 ? prevEmailsList : undefined,
        previousEmail: prevEmailsList.length > 0 ? prevEmailsList[prevEmailsList.length - 1] : undefined,
        ...(isClientRole && user ? {
          clientId: user.id,
          createdById: user.id,
          createdByEmail: user.email,
          clientEmail: user.email,
        } : {}),
      },
      isNew
    )

    if (!saved) {
      setStatusModalState({
        isOpen: true,
        type: "failed",
        title: "Account Save Failed",
        message: "Failed to record user account. Please check the provided information and try again.",
      })
      return
    }

    // If email transferred, dispatch email notifications to both addresses
    let transferNotificationMessage = ""
    let isTransferSuccess = true

    if (isEmailTransfer) {
      try {
        const { sendUserEmailTransferNotification } = await import("@/services/emailNotificationService")
        const notifRes = await sendUserEmailTransferNotification(
          userData.name || editingUser?.name || "User",
          oldEmail,
          newEmail,
          user?.name || "Administrator"
        )
        transferNotificationMessage = notifRes.message
        isTransferSuccess = notifRes.success
      } catch (err: any) {
        console.warn("Transfer notification failed:", err)
        transferNotificationMessage = `Account email transferred from ${oldEmail} to ${newEmail}. In-app notification delivered.`
      }
    }

    // Show Success / Failed Status Popup Modal
    setStatusModalState({
      isOpen: true,
      type: isTransferSuccess ? "success" : "failed",
      title: isEmailTransfer
        ? "Account Email Transferred"
        : (isNew ? "User Account Created" : "User Profile Updated"),
      message: isEmailTransfer
        ? transferNotificationMessage
        : (isNew ? `User "${userData.name}" has been created successfully.` : `User account "${userData.name || editingUser?.name}" has been updated successfully.`),
      details: isEmailTransfer ? { oldEmail, newEmail } : undefined,
    })

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

    if (saved.status === "Inactive") {
      const inactiveEmail = saved.email.toLowerCase().trim()
      localStorage.setItem("saampark_session_revoked", `${inactiveEmail}_inactive_${Date.now()}`)
      window.dispatchEvent(new CustomEvent("saampark_session_revoked", { detail: { email: inactiveEmail, reason: "inactive" } }))
    }

    setUsers((prev) => {
      let nextList: UserItem[] = []
      if (editingUser) {
        const filtered = prev.filter((u) => 
          String(u.id) !== String(editingUser.id) &&
          u.email.toLowerCase().trim() !== oldEmail &&
          u.email.toLowerCase().trim() !== newEmail
        )
        const updatedItem: UserItem = {
          ...editingUser,
          ...saved,
          role: userData.role || saved.role,
          permissions: (userData as any).permissions,
          previousEmails: prevEmailsList.length > 0 ? prevEmailsList : editingUser.previousEmails,
          previousEmail: prevEmailsList.length > 0 ? prevEmailsList[prevEmailsList.length - 1] : editingUser.previousEmail,
        }
        nextList = [updatedItem, ...filtered]
      } else {
        nextList = [saved, ...prev.filter((u) => u.email.toLowerCase().trim() !== saved.email.toLowerCase().trim())]
      }
      saveModuleDataToDB("users", nextList, "all")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new CustomEvent("saampark_data_synced"))
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

    setUsers((prev) => {
      const updatedList: UserItem[] = prev.map((u) => {
        if (u.id === id) {
          const nextStatus: UserStatus = u.status === "Active" ? "Inactive" : "Active"
          const updatedUser: UserItem = { ...u, status: nextStatus }
          recordUserAccount(updatedUser, false)

          if (nextStatus === "Inactive") {
            const inactiveEmail = u.email.toLowerCase().trim()
            localStorage.setItem("saampark_session_revoked", `${inactiveEmail}_inactive_${Date.now()}`)
            window.dispatchEvent(new CustomEvent("saampark_session_revoked", { detail: { email: inactiveEmail, reason: "inactive" } }))
          }

          return updatedUser
        }
        return u
      })
      saveModuleDataToDB("users", updatedList, "all")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"))
      }
      return updatedList
    })
  }


  const handleDeleteUser = async (id: string) => {
    const targetUser = users.find((u) => u.id === id)
    const targetEmail = targetUser?.email

    setUsers((prev) => prev.filter((u) => u.id !== id && (!targetEmail || u.email.toLowerCase().trim() !== targetEmail.toLowerCase().trim())))

    await deleteUser(id, targetEmail)
    setTimeout(() => {
      loadUsers()
    }, 150)
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
      {isLoading ? (
        <ThreeDotLoader text="Loading team members & users..." fullScreen={false} />
      ) : (
        <UserList
          users={visibleUsers}
          onEdit={handleOpenEditModal}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteUser}
          onViewOverview={(targetUser) => {
            setSelectedUserForOverview(targetUser)
            setIsOverviewModalOpen(true)
          }}
        />
      )}

      {/* User Account Overview & KYC Review Modal */}
      <UserOverviewModal
        isOpen={isOverviewModalOpen}
        user={selectedUserForOverview}
        onClose={() => {
          setIsOverviewModalOpen(false)
          setSelectedUserForOverview(null)
        }}
        onEdit={(targetUser) => {
          handleOpenEditModal(targetUser)
        }}
        onUserUpdated={(updatedUser) => {
          setUsers((prev) =>
            prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
          )
          setSelectedUserForOverview(updatedUser)
        }}
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

      {/* Success / Failed Status Feedback Popup Modal */}
      <AnimatePresence>
        {statusModalState.isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center space-y-4"
            >
              {/* Animated Glowing Status Icon */}
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                {statusModalState.type === "success" ? (
                  <>
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-500/20 relative z-10">
                      <CheckCircle2 size={32} className="stroke-[2.5]" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping opacity-75" />
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shadow-lg shadow-rose-500/20 relative z-10">
                      <AlertTriangle size={32} className="stroke-[2.5]" />
                    </div>
                  </>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {statusModalState.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed px-2">
                  {statusModalState.message}
                </p>
              </div>

              {/* Email Transfer Details Box (if applicable) */}
              {statusModalState.details && statusModalState.details.oldEmail && statusModalState.details.newEmail && (
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-2xl text-left text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-[11px] uppercase tracking-wider">
                    <Mail size={13} />
                    <span>Dual Login Enabled</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-zinc-500">
                      <span>Previous Email:</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300 line-through">
                        {statusModalState.details.oldEmail}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                      <span>New Primary Email:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {statusModalState.details.newEmail}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pt-1 border-t border-slate-200 dark:border-zinc-700">
                    💡 The user can now log in using <strong>either</strong> their old or new email address with their existing password.
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  onClick={() => setStatusModalState({ ...statusModalState, isOpen: false })}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  Awesome, Got it
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
