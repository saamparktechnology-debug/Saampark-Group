import { UserItem, UserRole } from "../types";
import { api } from "@/lib/api";
import { usePermissionStore } from "@/store/usePermissionStore";
import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync";

// Deleted user emails tracked in MySQL via markGlobalItemDeleted
const DELETED_KEY = "saampark_deleted_user_emails"

// Default System User Accounts for SAAMPARK Group (used only if MySQL has no users yet)
export const DEFAULT_SYSTEM_ACCOUNTS: UserItem[] = [
  {
    id: "usr_super_admin_visible",
    name: "Supriya (Super Admin)",
    email: "hiisupriya@gmail.com",
    role: "Super Admin",
    companyId: "tech",
    companyName: "SAAMPARK Group (All Companies)",
    status: "Active",
    department: "Executive Management",
    phone: "+91 98765 43210",
    password: "123456",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01",
  },
];

// Helper: get deleted user emails from localStorage cache (synced from MySQL deleted table)
export function getDeletedUserEmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper: check if a specific user email has been deleted
export function isUserDeleted(email: string): boolean {
  if (!email) return false;
  return getDeletedUserEmails().includes(email.toLowerCase().trim());
}

// Helper: mark a user email as permanently deleted (stored in MySQL via markGlobalItemDeleted + local cache)
export function markUserAsDeleted(email: string): void {
  if (!email) return;
  const normEmail = email.toLowerCase().trim();
  // Update local cache
  try {
    const current = getDeletedUserEmails();
    if (!current.includes(normEmail)) {
      localStorage.setItem(DELETED_KEY, JSON.stringify([...current, normEmail]));
    }
  } catch {}
  // Sync to MySQL
  markGlobalItemDeleted(normEmail, "users").catch(() => {});
}

// Helper: get user accounts — reads from MySQL, returns DEFAULT_SYSTEM_ACCOUNTS if empty
export async function getStoredUserAccountsAsync(): Promise<UserItem[]> {
  const dbData = await fetchModuleDataFromDB<UserItem[]>("users", DEFAULT_SYSTEM_ACCOUNTS);
  const data = Array.isArray(dbData) && dbData.length > 0 ? dbData : DEFAULT_SYSTEM_ACCOUNTS;
  const deletedEmails = getDeletedUserEmails();
  return data.filter((a) => !deletedEmails.includes(a.email.toLowerCase().trim()));
}

/** @deprecated Use getStoredUserAccountsAsync() */
export function getStoredUserAccounts(): UserItem[] {
  console.warn("[userService] getStoredUserAccounts() is deprecated — use getStoredUserAccountsAsync() (async).");
  return DEFAULT_SYSTEM_ACCOUNTS;
}

// Helper: save user accounts to MySQL only
export async function saveUserAccounts(accounts: UserItem[]): Promise<void> {
  await saveModuleDataToDB("users", accounts);
}

// Helper: check if an email is already registered
export async function isEmailRegistered(email: string): Promise<boolean> {
  const normEmail = email.toLowerCase().trim();
  if (isUserDeleted(normEmail)) return false;
  const accounts = await getStoredUserAccountsAsync();
  return accounts.some((acc) => acc.email.toLowerCase().trim() === normEmail);
}

// Helper: record a logged-in or newly created account into MySQL
export function recordUserAccount(user: Partial<UserItem>, isNewRegistration = false): UserItem | null {
  const normalizedEmail = (user.email || "").toLowerCase().trim();
  if (!normalizedEmail) return null;

  if (isUserDeleted(normalizedEmail) && !isNewRegistration) return null;

  // If explicit new registration, clear from deleted list
  if (isNewRegistration) {
    try {
      const deletedEmails = getDeletedUserEmails().filter((e) => e !== normalizedEmail);
      localStorage.setItem(DELETED_KEY, JSON.stringify(deletedEmails));
    } catch {}
  }

  // Build the account object
  const updatedAccount: UserItem = {
    id: user.id || `usr_${Date.now()}`,
    name: user.name || "User Account",
    email: normalizedEmail,
    role: user.role !== undefined ? user.role : "Teams",
    companyId: user.companyId || "tech",
    companyIds: user.companyIds || (user.companyId ? [user.companyId] : ["tech"]),
    companyName: user.companyName || (user.companyId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
    status: user.status || "Active",
    department: user.department || "General",
    phone: user.phone || "",
    password: user.password !== undefined ? user.password : "Password123",
    lastLogin: user.lastLogin || "Just now",
    joinedDate: user.joinedDate || new Date().toISOString().split("T")[0],
    permissions: (user as any).permissions,
    allowedModules: (user as any).allowedModules,
  };

  // Save to MySQL asynchronously (fire and forget since this can be called from sync contexts)
  getStoredUserAccountsAsync().then((currentAccounts) => {
    const existingIndex = currentAccounts.findIndex(
      (acc) => acc.email.toLowerCase().trim() === normalizedEmail
    );
    let updatedList: UserItem[];
    if (existingIndex >= 0) {
      updatedList = [...currentAccounts];
      updatedList[existingIndex] = { ...currentAccounts[existingIndex], ...updatedAccount };
    } else {
      updatedList = [updatedAccount, ...currentAccounts];
    }
    saveUserAccounts(updatedList).catch(() => {});
  }).catch(() => {});

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }
  return updatedAccount;
}




// Delete user permanently
export async function deleteUser(id: string, email?: string): Promise<boolean> {
  // Call backend REST API to mark deleted_at in MySQL database
  try {
    await api.delete(`/users/${id}`)
  } catch (err) {
    console.warn("Backend user delete API call error:", err)
  }

  await markGlobalItemDeleted(id, "users")
  if (email) await markGlobalItemDeleted(email, "users")

  const currentAccounts = await getStoredUserAccountsAsync();
  const targetUser = currentAccounts.find(
    (u) => u.id === id || (email && u.email.toLowerCase().trim() === email.toLowerCase().trim())
  );
  const targetEmail = (targetUser?.email || email || (id.includes("@") ? id : "")).toLowerCase().trim();

  if (targetEmail) {
    markUserAsDeleted(targetEmail);
    await markGlobalItemDeleted(targetEmail, "users");
  }

  const filtered = currentAccounts.filter(
    (acc) =>
      acc.id !== id &&
      acc.email.toLowerCase().trim() !== targetEmail
  );
  await saveUserAccounts(filtered);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    // Instantly log out if current tab belongs to the deleted user
    try {
      const { useAuthStore } = require("@/store/useAuthStore");
      const state = useAuthStore.getState();
      if (
        state.user &&
        (String(state.user.id) === String(id) ||
          (state.user.email && state.user.email.toLowerCase().trim() === targetEmail))
      ) {
        state.logout();
      }
    } catch (err) {
      console.warn("Session logout trigger error:", err);
    }
  }

  return true;
}

const HIDDEN_MASTER_EMAILS = ["supriyo.main@gmail.com"];

// Fetch user accounts persistently synced across all devices via MySQL DB
export async function getUsers(companyId?: string): Promise<UserItem[]> {
  const mapRoleName = (r?: string, rId?: number): UserRole => {
    if (rId === 1) return "Super Admin";
    if (rId === 2) return "Admin";
    if (rId === 4) return "Clients";
    if (!r) return "Teams";
    const lower = r.toLowerCase();
    if (lower.includes("super")) return "Super Admin";
    if (lower.includes("admin")) return "Admin";
    if (lower.includes("client")) return "Clients";
    return "Teams";
  };

  // 1. Always fetch primary list from MySQL app_data DB
  let dbUsers = await fetchModuleDataFromDB<UserItem[]>("users", []);

  if (!Array.isArray(dbUsers) || dbUsers.length === 0) {
    dbUsers = [
      {
        id: "usr_super_admin_visible",
        name: "Supriya (Super Admin)",
        email: "hiisupriya@gmail.com",
        role: "Super Admin",
        companyId: "tech",
        companyIds: ["tech", "digital"],
        companyName: "SAAMPARK Group (All Companies)",
        status: "Active",
        department: "Executive Management",
        phone: "+91 98765 43210",
        password: "123456",
        lastLogin: "Active Session",
        joinedDate: "2024-01-01",
      },
    ];
    saveModuleDataToDB("users", dbUsers);
  }

  // 2. Merge with live backend /users database table if available
  try {
    const res = await api.get("/users");
    const rawData = Array.isArray(res) ? res : res?.data?.users || res?.data || [];
    if (Array.isArray(rawData) && rawData.length > 0) {
      rawData.forEach((u: any) => {
        const emailNorm = (u.email || "").toLowerCase().trim();
        if (emailNorm && !HIDDEN_MASTER_EMAILS.includes(emailNorm)) {
          const existingIdx = dbUsers.findIndex((du) => du.email.toLowerCase().trim() === emailNorm);
          const existingItem = existingIdx >= 0 ? dbUsers[existingIdx] : null;
          const mappedRole = mapRoleName(u.role_name || u.role, u.role_id);
          const finalRole = mappedRole || existingItem?.role || "Teams";

          let permObj: any = null;
          if (typeof u.permissions === "string") {
            try { permObj = JSON.parse(u.permissions); } catch {}
          } else if (u.permissions && typeof u.permissions === "object") {
            permObj = u.permissions;
          }

          if (permObj) {
            const userIdStr = String(u.id);
            if (Array.isArray(permObj.allowedModules)) {
              usePermissionStore.getState().setUserPermissions(userIdStr, permObj.allowedModules);
              usePermissionStore.getState().setUserPermissions(emailNorm, permObj.allowedModules);
            }
            if (permObj.actionMatrix && typeof permObj.actionMatrix === "object") {
              usePermissionStore.getState().setUserAllModuleActions(userIdStr, permObj.actionMatrix);
              usePermissionStore.getState().setUserAllModuleActions(emailNorm, permObj.actionMatrix);
            }
          }

          let parsedCompanyIds: string[] = [];
          if (u.company_ids) {
            try { parsedCompanyIds = JSON.parse(u.company_ids); } catch { parsedCompanyIds = [u.company_ids]; }
          }
          if (!Array.isArray(parsedCompanyIds) || parsedCompanyIds.length === 0) {
            parsedCompanyIds = existingItem?.companyIds || [u.company_id || "tech"];
          }

          const item: UserItem = {
            id: String(u.id || `usr_${Math.random()}`),
            name: u.full_name || u.name || u.first_name || u.email || "User Account",
            email: emailNorm,
            role: finalRole,
            companyId: u.company_id || parsedCompanyIds[0] || "tech",
            companyIds: parsedCompanyIds,
            companyName:
              u.company_name ||
              (parsedCompanyIds.includes("digital") && parsedCompanyIds.includes("tech")
                ? "SAAMPARK Group (Multiple)"
                : u.company_id === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
            status: u.status === "inactive" || u.is_active === false ? "Inactive" : "Active",
            department: u.department || existingItem?.department || "General",
            phone: u.phone || existingItem?.phone || "",
            password: existingItem?.password || "Password123",
            lastLogin: u.last_login || existingItem?.lastLogin || "Active session",
            joinedDate: u.created_at ? u.created_at.split("T")[0] : existingItem?.joinedDate || new Date().toISOString().split("T")[0],
            allowedModules: permObj?.allowedModules || existingItem?.allowedModules,
          };

          if (existingIdx >= 0) {
            dbUsers[existingIdx] = { ...existingItem, ...item };
          } else {
            dbUsers.push(item);
          }
        }
      });

      saveModuleDataToDB("users", dbUsers);
    }
  } catch (err) {
    console.warn("Live API /users read warning:", err);
  }

  // 3. Filter out deleted user emails and hidden master admin account
  const deletedEmails = getDeletedUserEmails().map((e) => e.toLowerCase().trim());
  const cleanUsers = dbUsers.filter((u) => {
    const emailNorm = (u.email || "").toLowerCase().trim();
    return !HIDDEN_MASTER_EMAILS.includes(emailNorm) && !deletedEmails.includes(emailNorm);
  });

  if (!companyId || companyId === "all") {
    return cleanUsers;
  }
  return cleanUsers.filter((u) => {
    if (u.role === "Super Admin") return true;
    if (u.companyIds && Array.isArray(u.companyIds)) {
      return u.companyIds.includes(companyId);
    }
    return u.companyId === companyId;
  });
}



