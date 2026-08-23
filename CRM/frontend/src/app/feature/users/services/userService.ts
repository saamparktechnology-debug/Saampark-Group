import { UserItem, UserRole } from "../types";
import { api } from "@/lib/api";
import { usePermissionStore } from "@/store/usePermissionStore";

const STORAGE_KEY = "saampark_registered_accounts";
const DELETED_KEY = "saampark_deleted_user_emails";

// Default System User Accounts for SAAMPARK Group
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
  {
    id: "usr_super_admin_hidden",
    name: "Supriyo Main (Master Super Admin)",
    email: "supriyo.main@gmail.com",
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


// Helper to get persistent deleted user emails
export function getDeletedUserEmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper to check if a specific user email has been deleted
export function isUserDeleted(email: string): boolean {
  if (!email) return false;
  const deletedEmails = getDeletedUserEmails();
  return deletedEmails.includes(email.toLowerCase().trim());
}

// Helper to mark a user email as permanently deleted
export function markUserAsDeleted(email: string): void {
  if (typeof window === "undefined" || !email) return;
  try {
    const normEmail = email.toLowerCase().trim();
    const currentDeleted = getDeletedUserEmails();
    if (!currentDeleted.includes(normEmail)) {
      currentDeleted.push(normEmail);
      localStorage.setItem(DELETED_KEY, JSON.stringify(currentDeleted));
    }
  } catch (err) {
    console.error("Error marking user as deleted:", err);
  }
}

// Helper to get persistent registered/logged-in users from localStorage
export function getStoredUserAccounts(): UserItem[] {
  if (typeof window === "undefined") return DEFAULT_SYSTEM_ACCOUNTS;
  try {
    const deletedEmails = getDeletedUserEmails();
    const raw = localStorage.getItem(STORAGE_KEY);
    let accounts: UserItem[];
    if (!raw) {
      accounts = DEFAULT_SYSTEM_ACCOUNTS;
    } else {
      const parsed = JSON.parse(raw);
      accounts = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SYSTEM_ACCOUNTS;
    }
    return accounts.filter((a) => !deletedEmails.includes(a.email.toLowerCase().trim()));
  } catch (err) {
    console.error("Error reading stored user accounts:", err);
    return DEFAULT_SYSTEM_ACCOUNTS;
  }
}

// Helper to save user accounts into localStorage & MySQL DB
export function saveUserAccounts(accounts: UserItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    saveModuleDataToDB("users", accounts);
  } catch (err) {
    console.error("Error saving user accounts:", err);
  }
}


// Helper to check if an email is already registered in the system
export function isEmailRegistered(email: string): boolean {
  const normEmail = email.toLowerCase().trim();
  if (isUserDeleted(normEmail)) return false;
  const accounts = getStoredUserAccounts();
  return accounts.some((acc) => acc.email.toLowerCase().trim() === normEmail);
}

// Helper to record a logged-in or newly created account
export function recordUserAccount(user: Partial<UserItem>, isNewRegistration = false): UserItem | null {
  const normalizedEmail = (user.email || "").toLowerCase().trim();
  if (!normalizedEmail) return null;

  // Do NOT re-record or un-delete an account if it was deleted (unless explicit new signup)
  if (isUserDeleted(normalizedEmail) && !isNewRegistration) {
    return null;
  }

  // If explicit new registration, clear from deleted list
  if (isNewRegistration && typeof window !== "undefined") {
    const deletedEmails = getDeletedUserEmails().filter((e) => e !== normalizedEmail);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deletedEmails));
    try {
      const rawUniv = localStorage.getItem("saampark_universal_deleted_ids");
      if (rawUniv) {
        const univList: string[] = JSON.parse(rawUniv);
        const filteredUniv = univList.filter((id) => id.toLowerCase().trim() !== normalizedEmail);
        localStorage.setItem("saampark_universal_deleted_ids", JSON.stringify(filteredUniv));
      }
    } catch {}
  }

  const currentAccounts = getStoredUserAccounts();

  const existingIndex = currentAccounts.findIndex(
    (acc) => acc.email.toLowerCase().trim() === normalizedEmail
  );

  const updatedAccount: UserItem = {
    id: user.id || (existingIndex >= 0 ? currentAccounts[existingIndex].id : `usr_${Date.now()}`),
    name: user.name || (existingIndex >= 0 ? currentAccounts[existingIndex].name : "User Account"),
    email: normalizedEmail,
    role: user.role !== undefined ? user.role : (existingIndex >= 0 ? currentAccounts[existingIndex].role : "Teams"),
    companyId: user.companyId || (existingIndex >= 0 ? currentAccounts[existingIndex].companyId : "tech"),
    companyName:
      user.companyName ||
      (user.companyId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
    status: user.status || "Active",
    department: user.department || (existingIndex >= 0 ? currentAccounts[existingIndex].department : "General"),
    phone: user.phone || (existingIndex >= 0 ? currentAccounts[existingIndex].phone : ""),
    password: user.password !== undefined ? user.password : (existingIndex >= 0 ? currentAccounts[existingIndex].password : "Password123"),
    lastLogin: user.lastLogin || "Just now",
    joinedDate:
      user.joinedDate ||
      (existingIndex >= 0
        ? currentAccounts[existingIndex].joinedDate
        : new Date().toISOString().split("T")[0]),
  };

  if (existingIndex >= 0) {
    currentAccounts[existingIndex] = updatedAccount;
  } else {
    currentAccounts.unshift(updatedAccount);
  }

  saveUserAccounts(currentAccounts);
  if (typeof window !== "undefined") {
    localStorage.setItem("saampark_user_updated", `${normalizedEmail}_${Date.now()}`);
    window.dispatchEvent(new Event("storage"));
  }
  return updatedAccount;
}

import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"


// Delete user permanently
export async function deleteUser(id: string, email?: string): Promise<boolean> {
  // Call backend REST API to mark deleted_at in MySQL database
  try {
    await api.delete(`/users/${id}`)
  } catch (err) {
    console.warn("Backend user delete API call error:", err)
  }

  markGlobalItemDeleted(id, "users")
  if (email) markGlobalItemDeleted(email, "users")

  const currentAccounts = getStoredUserAccounts();
  const targetUser = currentAccounts.find(
    (u) => u.id === id || (email && u.email.toLowerCase().trim() === email.toLowerCase().trim())
  );
  const targetEmail = (targetUser?.email || email || (id.includes("@") ? id : "")).toLowerCase().trim();

  if (targetEmail) {
    markUserAsDeleted(targetEmail);
    markGlobalItemDeleted(targetEmail, "users");
  }



  const filtered = currentAccounts.filter(
    (acc) =>
      acc.id !== id &&
      acc.email.toLowerCase().trim() !== targetEmail
  );
  saveUserAccounts(filtered);

  if (typeof window !== "undefined") {
    // Revoke active sessions across all tabs
    localStorage.setItem("saampark_session_revoked", `${targetEmail}_${Date.now()}`);
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

  // Background API delete request
  try {
    await api.delete(`/users/${id}`).catch(() => {});
  } catch (err) {
    console.warn("Backend API delete request:", err);
  }

  return true;
}

const HIDDEN_MASTER_EMAILS = ["supriyo.main@gmail.com"];

// Fetch user accounts persistently synced across all devices via MySQL DB
export async function getUsers(companyId?: string): Promise<UserItem[]> {
  const mapRoleName = (r?: string): UserRole => {
    if (!r) return "Teams";
    const lower = r.toLowerCase();
    if (lower.includes("super admin") || lower.includes("superadmin")) return "Super Admin";
    if (lower.includes("admin")) return "Admin";
    if (lower.includes("manager") || lower.includes("team")) return "Teams";
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
      let updated = false;
      const storedAccounts = getStoredUserAccounts();

      rawData.forEach((u: any) => {
        const emailNorm = (u.email || "").toLowerCase().trim();
        if (emailNorm && !HIDDEN_MASTER_EMAILS.includes(emailNorm)) {
          const localMatches = storedAccounts.find((sa) => sa.email.toLowerCase().trim() === emailNorm);
          const existingIdx = dbUsers.findIndex((du) => du.email.toLowerCase().trim() === emailNorm);
          const existingItem = existingIdx >= 0 ? dbUsers[existingIdx] : null;
          const mappedRole = mapRoleName(u.role_name || u.role);
          const finalRole = (mappedRole && mappedRole !== "Teams") ? mappedRole : (existingItem?.role || localMatches?.role || mappedRole || "Teams");

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

          const item: UserItem = {
            id: String(u.id || `usr_${Math.random()}`),
            name: u.full_name || u.name || u.first_name || u.email || "User Account",
            email: emailNorm,
            role: finalRole,
            companyId: u.company_id || u.companyId || "tech",
            companyName:
              u.company_name ||
              (u.company_id === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
            status: u.status === "inactive" || u.is_active === false ? "Inactive" : "Active",
            department: u.department || "Operations",
            phone: u.phone || "",
            password: localMatches?.password || existingItem?.password || "Password123",
            lastLogin: u.last_login || "Active session",
            joinedDate: u.created_at ? u.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
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

  // 3. Sync all stored Clients & Won Leads from DB + Local Storage so every admin account across all devices sees all clients in Users
  try {
    const [dbClients, dbLeads] = await Promise.all([
      fetchModuleDataFromDB<any[]>("clients", []).catch(() => []),
      fetchModuleDataFromDB<any[]>("leads", []).catch(() => []),
    ]);

    const localClientsRaw = typeof window !== "undefined" ? localStorage.getItem("saampark_stored_clients") : null;
    const localClients: any[] = localClientsRaw ? JSON.parse(localClientsRaw) : [];

    const allClientSources: any[] = [
      ...(Array.isArray(dbClients) ? dbClients : []),
      ...(Array.isArray(localClients) ? localClients : []),
    ];

    // Also include won leads
    if (Array.isArray(dbLeads)) {
      dbLeads.forEach((l) => {
        if (l.status === "Won" || l.status === "Store Visit") {
          allClientSources.push({
            id: `cli_${l.id}`,
            name: l.name,
            primaryContact: l.primaryContact || l.name,
            email: l.email || `lead_${l.id}@saampark.in`,
            phone: l.phone || "N/A",
            createdAt: l.createdAt,
          });
        }
      });
    }

    allClientSources.forEach((c) => {
      if (!c || !c.name) return;
      const clientEmail = (c.email || `${c.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@saampark-client.com`).toLowerCase().trim();
      const clientId = `usr_cli_${c.id}`;
      const exists = dbUsers.some((u) => u.email.toLowerCase().trim() === clientEmail || u.id === clientId || u.id === c.id);
      if (!exists) {
        dbUsers.push({
          id: clientId,
          name: c.primaryContact || c.name || "Client Account",
          email: clientEmail,
          role: "Clients",
          companyId: "tech",
          companyName: c.name || "Client",
          status: "Active",
          department: "Clients",
          phone: c.phone || "",
          password: "Password123",
          lastLogin: "Active session",
          joinedDate: typeof c.createdAt === "number" ? new Date(c.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        });
      }
    });

    saveModuleDataToDB("users", dbUsers);
  } catch (err) {
    console.warn("Client & won leads sync to users warning:", err);
  }

  // 4. Filter out deleted user emails and hidden master admin account
  const deletedEmails = getDeletedUserEmails().map((e) => e.toLowerCase().trim());
  const cleanUsers = dbUsers.filter((u) => {
    const emailNorm = (u.email || "").toLowerCase().trim();
    return !HIDDEN_MASTER_EMAILS.includes(emailNorm) && !deletedEmails.includes(emailNorm);
  });

  // Sync to local storage cache for instant hydration
  if (typeof window !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanUsers)); } catch {}
  }

  if (!companyId || companyId === "all") {
    return cleanUsers;
  }
  return cleanUsers.filter((u) => u.companyId === companyId || u.role === "Super Admin");
}



