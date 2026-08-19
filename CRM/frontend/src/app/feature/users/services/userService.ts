import { UserItem, UserRole } from "../types";
import { api } from "@/lib/api";
import { usePermissionStore } from "@/store/usePermissionStore";

const STORAGE_KEY = "saampark_registered_accounts";
const DELETED_KEY = "saampark_deleted_user_emails";

// Default System User Accounts for SAAMPARK Group
export const DEFAULT_SYSTEM_ACCOUNTS: UserItem[] = [
  {
    id: "usr_super_admin",
    name: "Rahul Sharma",
    email: "superadmin@saampark.in",
    role: "Super Admin",
    companyId: "tech",
    companyName: "SAAMPARK Group (All Companies)",
    status: "Active",
    department: "Executive Management",
    phone: "+91 98765 43210",
    lastLogin: "Today (Active Session)",
    joinedDate: "2024-01-01",
  },
  {
    id: "usr_admin_tech",
    name: "Priya Patel",
    email: "admin@tech.saampark.in",
    role: "Admin",
    companyId: "tech",
    companyName: "SAAMPARK Technology",
    status: "Active",
    department: "IT & Operations",
    phone: "+91 98123 45678",
    lastLogin: "Today at 09:15 AM",
    joinedDate: "2024-02-15",
  },
  {
    id: "usr_teams",
    name: "Sneha Gupta",
    email: "team@saampark.in",
    role: "Teams",
    companyId: "tech",
    companyName: "SAAMPARK Technology",
    status: "Active",
    department: "Project Management",
    phone: "+91 96543 21098",
    lastLogin: "Today at 08:50 AM",
    joinedDate: "2024-04-10",
  },
  {
    id: "usr_user",
    name: "John Doe",
    email: "john@example.com",
    role: "Teams",
    companyId: "tech",
    companyName: "SAAMPARK Technology",
    status: "Active",
    department: "Software Development",
    phone: "+91 94321 09876",
    lastLogin: "Today at 10:05 AM",
    joinedDate: "2024-06-15",
  },
  {
    id: "usr_client",
    name: "Acme Corp Client",
    email: "client@acmecorp.com",
    role: "Clients",
    companyId: "tech",
    companyName: "Acme Corporation",
    status: "Active",
    department: "Client Portal",
    phone: "+91 91098 76543",
    lastLogin: "Yesterday at 04:20 PM",
    joinedDate: "2024-08-01",
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

// Helper to save user accounts into localStorage
export function saveUserAccounts(accounts: UserItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
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
  }

  const currentAccounts = getStoredUserAccounts();

  const existingIndex = currentAccounts.findIndex(
    (acc) => acc.email.toLowerCase().trim() === normalizedEmail
  );

  const updatedAccount: UserItem = {
    id: user.id || (existingIndex >= 0 ? currentAccounts[existingIndex].id : `usr_${Date.now()}`),
    name: user.name || (existingIndex >= 0 ? currentAccounts[existingIndex].name : "User Account"),
    email: normalizedEmail,
    role: user.role || (existingIndex >= 0 ? currentAccounts[existingIndex].role : "Teams"),
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

// Delete user permanently
export async function deleteUser(id: string, email?: string): Promise<boolean> {
  const currentAccounts = getStoredUserAccounts();
  const targetUser = currentAccounts.find(
    (u) => u.id === id || (email && u.email.toLowerCase().trim() === email.toLowerCase().trim())
  );
  const targetEmail = (targetUser?.email || email || (id.includes("@") ? id : "")).toLowerCase().trim();

  if (targetEmail) {
    markUserAsDeleted(targetEmail);
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

// Fetch user accounts
export async function getUsers(companyId?: string): Promise<UserItem[]> {
  let liveUsers: UserItem[] = [];

  const mapRoleName = (r?: string): UserRole => {
    if (!r) return "Teams";
    const lower = r.toLowerCase();
    if (lower.includes("super admin") || lower.includes("superadmin")) return "Super Admin";
    if (lower.includes("admin")) return "Admin";
    if (lower.includes("manager") || lower.includes("team")) return "Teams";
    if (lower.includes("client")) return "Clients";
    return "Teams";
  };

  try {
    // Attempt live API fetch from /users
    const res = await api.get("/users");
    const rawData = Array.isArray(res) ? res : res?.data?.users || res?.data || [];
    if (Array.isArray(rawData) && rawData.length > 0) {
      const storedAccounts = getStoredUserAccounts();
      liveUsers = rawData.map((u: any) => {
        const emailNorm = (u.email || "").toLowerCase().trim();
        const localMatches = storedAccounts.find((sa) => sa.email.toLowerCase().trim() === emailNorm);

        const item: UserItem = {
          id: String(u.id || `usr_${Math.random()}`),
          name: u.full_name || u.name || u.first_name || u.email || "User Account",
          email: emailNorm,
          role: mapRoleName(u.role_name || u.role),
          companyId: u.company_id || u.companyId || "tech",
          companyName:
            u.company_name ||
            (u.company_id === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
          status: u.status === "inactive" || u.is_active === false ? "Inactive" : "Active",
          department: u.department || "Operations",
          phone: u.phone || "",
          password: localMatches?.password || "Password123",
          lastLogin: u.last_login || "Active session",
          joinedDate: u.created_at ? u.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        };

        if (u.permissions && typeof window !== "undefined") {
          try {
            const parsed = typeof u.permissions === "string" ? JSON.parse(u.permissions) : u.permissions;
            if (parsed.actionMatrix) {
              const { setUserAllModuleActions, setUserPermissions } = usePermissionStore.getState();
              setUserAllModuleActions(item.id, parsed.actionMatrix);
              setUserAllModuleActions(item.email, parsed.actionMatrix);
              if (parsed.allowedModules) {
                setUserPermissions(item.id, parsed.allowedModules);
                setUserPermissions(item.email, parsed.allowedModules);
              }
            }
          } catch (e) {
            console.warn("Permissions parse warning:", e);
          }
        }
        return item;
      });

      // Live DB users are authoritative! Purge any stale deleted flags for active DB users
      if (typeof window !== "undefined") {
        const liveEmails = liveUsers.map((u) => u.email.toLowerCase());
        const cleanedDeleted = getDeletedUserEmails().filter((email) => !liveEmails.includes(email.toLowerCase()));
        localStorage.setItem(DELETED_KEY, JSON.stringify(cleanedDeleted));
      }
    }
  } catch (err) {
    console.warn("Live API /users check:", err);
  }

  const deletedEmails = getDeletedUserEmails();
  const storedAccounts = getStoredUserAccounts();

  // Deduplicate by email
  const allAccountsMap = new Map<string, UserItem>();

  // 1. Live database users first
  liveUsers.forEach((u) => {
    allAccountsMap.set(u.email.toLowerCase(), u);
  });

  // 2. Default demo system accounts
  DEFAULT_SYSTEM_ACCOUNTS.forEach((u) => {
    if (!allAccountsMap.has(u.email.toLowerCase()) && !deletedEmails.includes(u.email.toLowerCase())) {
      allAccountsMap.set(u.email.toLowerCase(), u);
    }
  });

  // 3. Stored accounts
  storedAccounts.forEach((u) => {
    if (!allAccountsMap.has(u.email.toLowerCase()) && !deletedEmails.includes(u.email.toLowerCase())) {
      allAccountsMap.set(u.email.toLowerCase(), u);
    }
  });

  const merged = Array.from(allAccountsMap.values());

  if (!companyId || companyId === "all") {
    return merged;
  }

  return merged.filter(
    (u) => u.companyId === companyId || u.role === "Super Admin"
  );
}
