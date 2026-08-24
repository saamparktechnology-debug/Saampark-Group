import { UserItem, UserRole } from "../types";
import { api } from "@/lib/api";
import { usePermissionStore } from "@/store/usePermissionStore";
import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync";

// Deleted user emails tracked in MySQL via markGlobalItemDeleted
const DELETED_KEY = "saampark_deleted_user_emails"

// Default System User Accounts for SAAMPARK Group (used only if MySQL has no users yet)
// Default System User Accounts for SAAMPARK Group
export const DEFAULT_SYSTEM_ACCOUNTS: UserItem[] = [
  {
    id: "usr_saampark_group_team",
    name: "SAAMPARK Group Team",
    email: "saamparkgroup@gmail.com",
    role: "Teams",
    companyId: "tech",
    companyIds: ["tech", "digital"],
    companyName: "SAAMPARK Technology",
    status: "Active",
    department: "Sales & Lead Operations",
    phone: "+91 98765 43210",
    password: "Password123",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01",
  },
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
  {
    id: "usr_admin_default",
    name: "Admin User",
    email: "admin@saampark.in",
    role: "Admin",
    companyId: "tech",
    companyIds: ["tech", "digital"],
    companyName: "SAAMPARK Technology",
    status: "Active",
    department: "Operations",
    phone: "+91 98765 43211",
    password: "admin123",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01",
  },
  {
    id: "usr_team_default",
    name: "Rahul Sharma (Team Lead)",
    email: "team@saampark.in",
    role: "Teams",
    companyId: "tech",
    companyIds: ["tech"],
    companyName: "SAAMPARK Technology",
    status: "Active",
    department: "Development",
    phone: "+91 98765 43212",
    password: "Password123",
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

// Helper: save user accounts to MySQL only (master 'all' company scope)
export async function saveUserAccounts(accounts: UserItem[]): Promise<void> {
  await saveModuleDataToDB("users", accounts, "all");
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
      const prevName = currentAccounts[existingIndex].name;
      updatedList = [...currentAccounts];
      updatedList[existingIndex] = { ...currentAccounts[existingIndex], ...updatedAccount };

      if (prevName && prevName.trim() !== updatedAccount.name.trim()) {
        cascadeUserNameChange(prevName, normalizedEmail, updatedAccount.name).catch(() => {});
      }
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

// Cascade user name change across assigned Tasks, Leads, and Clients
export async function cascadeUserNameChange(oldName: string, email: string, newName: string): Promise<void> {
  if (!oldName || !newName || oldName.trim().toLowerCase() === newName.trim().toLowerCase()) return;
  const oNameNorm = oldName.trim().toLowerCase();
  const emailNorm = email.toLowerCase().trim();

  // 1. Tasks
  try {
    const tasks = await fetchModuleDataFromDB<any[]>("tasks", [], "all");
    let changed = false;
    const updated = tasks.map((t) => {
      let tChanged = false;
      let assignedTo = t.assignedTo || "";
      let collaborators = t.collaborators || "";

      if (assignedTo.toLowerCase().trim() === oNameNorm || assignedTo.toLowerCase().trim() === emailNorm) {
        assignedTo = newName;
        tChanged = true;
      }
      if (collaborators && (collaborators.toLowerCase().includes(oNameNorm) || collaborators.toLowerCase().includes(emailNorm))) {
        collaborators = collaborators.replace(new RegExp(oldName, "gi"), newName);
        tChanged = true;
      }
      if (tChanged) {
        changed = true;
        return { ...t, assignedTo, collaborators };
      }
      return t;
    });
    if (changed) {
      await saveModuleDataToDB("tasks", updated, "all");
    }
  } catch (err) {
    console.warn("Cascade tasks update warning:", err);
  }

  // 2. Leads
  try {
    const leads = await fetchModuleDataFromDB<any[]>("leads", [], "all");
    let changed = false;
    const updated = leads.map((l) => {
      let lChanged = false;
      let assignedTo = l.assignedTo || "";
      let caller = l.caller || "";
      let owner = l.owner || "";

      if (assignedTo.toLowerCase().trim() === oNameNorm || assignedTo.toLowerCase().trim() === emailNorm) {
        assignedTo = newName;
        lChanged = true;
      }
      if (caller.toLowerCase().trim() === oNameNorm || caller.toLowerCase().trim() === emailNorm) {
        caller = newName;
        lChanged = true;
      }
      if (owner.toLowerCase().trim() === oNameNorm || owner.toLowerCase().trim() === emailNorm) {
        owner = newName;
        lChanged = true;
      }
      if (lChanged) {
        changed = true;
        return { ...l, assignedTo, caller, owner };
      }
      return l;
    });
    if (changed) {
      await saveModuleDataToDB("leads", updated, "all");
    }
  } catch (err) {
    console.warn("Cascade leads update warning:", err);
  }

  // 3. Clients
  try {
    const clients = await fetchModuleDataFromDB<any[]>("clients", [], "all");
    let changed = false;
    const updated = clients.map((c) => {
      let cChanged = false;
      let owner = c.owner || "";
      let primaryContact = c.primaryContact || "";

      if (owner.toLowerCase().trim() === oNameNorm || owner.toLowerCase().trim() === emailNorm) {
        owner = newName;
        cChanged = true;
      }
      if (primaryContact.toLowerCase().trim() === oNameNorm || primaryContact.toLowerCase().trim() === emailNorm) {
        primaryContact = newName;
        cChanged = true;
      }
      if (cChanged) {
        changed = true;
        return { ...c, owner, primaryContact };
      }
      return c;
    });
    if (changed) {
      await saveModuleDataToDB("clients", updated, "all");
    }
  } catch (err) {
    console.warn("Cascade clients update warning:", err);
  }
}

// Delete user permanently
export async function deleteUser(id: string, email?: string): Promise<boolean> {
  const normEmail = email ? email.toLowerCase().trim() : (id.includes("@") ? id.toLowerCase().trim() : "");

  // 1. Mark as deleted in MySQL deleted_items table & local cache
  await markGlobalItemDeleted(id, "users");
  if (normEmail) {
    await markGlobalItemDeleted(normEmail, "users");
    markUserAsDeleted(normEmail);
  }

  // 2. Call backend REST API delete endpoint
  try {
    await api.delete(`/users/${encodeURIComponent(id)}`);
    if (normEmail && normEmail !== id) {
      await api.delete(`/users/${encodeURIComponent(normEmail)}`);
    }
  } catch (err) {
    console.warn("Backend user delete API call warning:", err);
  }

  // 3. Remove user from app_data master list under 'all' company scope
  const currentAccounts = await getStoredUserAccountsAsync();
  const filtered = currentAccounts.filter((acc) => {
    const accEmail = (acc.email || "").toLowerCase().trim();
    const accId = String(acc.id || "").toLowerCase().trim();
    const targetId = String(id).toLowerCase().trim();
    return accId !== targetId && (!normEmail || accEmail !== normEmail);
  });

  await saveModuleDataToDB("users", filtered, "all");

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("saampark_registered_accounts", JSON.stringify(filtered));
    } catch {}
    window.dispatchEvent(new Event("storage"));

    // Instantly log out if current tab belongs to deleted user
    try {
      const { useAuthStore } = require("@/store/useAuthStore");
      const state = useAuthStore.getState();
      if (
        state.user &&
        (String(state.user.id) === String(id) ||
          (state.user.email && state.user.email.toLowerCase().trim() === normEmail))
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
    if (rId === 3) return "Teams";
    if (rId === 4) return "Clients";
    if (!r) return "Teams";
    const lower = r.toLowerCase();
    if (lower.includes("super")) return "Super Admin";
    if (lower.includes("admin")) return "Admin";
    if (lower.includes("client")) return "Clients";
    return "Teams";
  };

  // 1. Fetch all primary user records from MySQL app_data DB (force companyId='all' so no users are filtered out prematurely)
  let dbUsers = await fetchModuleDataFromDB<UserItem[]>("users", DEFAULT_SYSTEM_ACCOUNTS, "all");
  if (!Array.isArray(dbUsers)) dbUsers = [];

  const deletedEmails = getDeletedUserEmails().map((e) => e.toLowerCase().trim());

  // Ensure default system accounts (Super Admin, Admin, Teams) exist in dbUsers unless deleted
  DEFAULT_SYSTEM_ACCOUNTS.forEach((sysAcc) => {
    const sysEmail = sysAcc.email.toLowerCase().trim();
    if (!deletedEmails.includes(sysEmail)) {
      const idx = dbUsers.findIndex((u) => u.email.toLowerCase().trim() === sysEmail);
      if (idx < 0) {
        dbUsers.unshift(sysAcc);
      }
    }
  });

  // Ensure currently logged-in user exists in dbUsers
  try {
    const { useAuthStore } = require("@/store/useAuthStore");
    const currentUser = useAuthStore.getState().user;
    if (currentUser && currentUser.email) {
      const curEmail = currentUser.email.toLowerCase().trim();
      if (!deletedEmails.includes(curEmail)) {
        const idx = dbUsers.findIndex((u) => u.email.toLowerCase().trim() === curEmail);
        if (idx < 0) {
          dbUsers.unshift({
            id: String(currentUser.id || `usr_${Date.now()}`),
            name: currentUser.name || "User Account",
            email: curEmail,
            role: currentUser.role || "Super Admin",
            companyId: currentUser.companyId || "tech",
            companyIds: currentUser.companyIds || (currentUser.companyId ? [currentUser.companyId] : ["tech"]),
            companyName: "SAAMPARK Group",
            status: "Active",
            department: currentUser.department || "Executive",
            phone: currentUser.phone || "",
            password: "123456",
            lastLogin: "Active Session",
            joinedDate: new Date().toISOString().split("T")[0],
          });
        }
      }
    }
  } catch {}

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
    }
  } catch (err) {
    console.warn("Live API /users read warning:", err);
  }

  saveModuleDataToDB("users", dbUsers, "all").catch(() => {});

  // 3. Filter out deleted user emails and hidden master admin account
  const cleanUsers = dbUsers.filter((u) => {
    const emailNorm = (u.email || "").toLowerCase().trim();
    return !HIDDEN_MASTER_EMAILS.includes(emailNorm) && !deletedEmails.includes(emailNorm);
  });

  if (!companyId || companyId === "all") {
    return cleanUsers;
  }

  const targetComp = String(companyId).toLowerCase().trim();

  return cleanUsers.filter((u) => {
    if (u.role === "Super Admin") return true;

    const uCompId = String(u.companyId || "").toLowerCase().trim();
    if (!uCompId || uCompId === "1" || uCompId === "all" || uCompId === targetComp) return true;

    if (u.companyIds && Array.isArray(u.companyIds)) {
      return u.companyIds.some((c) => {
        const cNorm = String(c).toLowerCase().trim();
        return !cNorm || cNorm === "1" || cNorm === "all" || cNorm === targetComp;
      });
    }

    return false;
  });
}



