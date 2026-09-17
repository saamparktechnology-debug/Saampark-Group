import { UserItem, UserRole } from "../types";
import { api } from "@/lib/api";
import { usePermissionStore } from "@/store/usePermissionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  filterGlobalDeletedItems, 
  markGlobalItemDeleted, 
  isGlobalItemDeleted,
  unmarkGlobalItemDeleted,
  fetchModuleDataFromDB, 
  saveModuleDataToDB,
  syncGlobalDeletedIds,
  getLocalDeletedIds 
} from "@/lib/storageSync";
import { recordActivityLog } from "@/services/activityLogService";

// Deleted user emails tracked in MySQL via markGlobalItemDeleted
const DELETED_KEY = "saampark_deleted_user_emails"

// Helper: Root Super Admin is permanent and immutable
export const isRootSuperAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return e === "saampark.official@gmail.com" || e === "saampark.official";
};

// Default System User Accounts for SAAMPARK Group (used only if MySQL has no users yet)
// Default System User Accounts for SAAMPARK Group (used only for initial DB bootstrap)
export const DEFAULT_SYSTEM_ACCOUNTS: UserItem[] = [
  {
    id: "usr_root_super_admin",
    name: "Supriya (Super Admin)",
    email: "saampark.official@gmail.com",
    role: "Super Admin",
    companyId: "tech",
    companyIds: ["tech", "digital", "consultancy"],
    companyName: "SAAMPARK Group (All Companies)",
    status: "Active",
    department: "Executive Management",
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
    id: "usr_admin_main",
    name: "Chiranjit Mahapatra",
    email: "saamparktechnologyresearch@gmail.com",
    role: "Admin",
    companyId: "tech",
    companyIds: ["tech"],
    companyName: "SAAMPARK Technology",
    status: "Active",
    department: "Operations",
    phone: "+91 98765 43211",
    password: "admin123",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01",
  },
  {
    id: "usr_team_rakhi",
    name: "Rakhi Ghosh",
    email: "rakhighosh25899@gmail.com",
    role: "Teams",
    companyId: "tech",
    companyIds: ["tech"],
    companyName: "SAAMPARK Technology",
    status: "Active",
    department: "Sales & Support",
    phone: "+91 98765 43212",
    password: "Password123",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01",
  },
  {
    id: "usr_admin_vikram",
    name: "Vikram Malhotra (Admin)",
    email: "admin@saampark.in",
    role: "Admin",
    companyId: "tech",
    companyIds: ["tech", "digital"],
    companyName: "SAAMPARK Technology & Digital",
    branchId: "1",
    branchName: "Head Office - Mumbai & Kolkata Technology Center",
    branchIds: ["1"],
    status: "Active",
    department: "Operations",
    phone: "+91 98765 11111",
    password: "admin123",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01",
  },
  {
    id: "usr_team_aman",
    name: "Aman Verma (Team Member)",
    email: "team@saampark.in",
    role: "Teams",
    companyId: "tech",
    companyIds: ["tech"],
    companyName: "SAAMPARK Technology",
    branchId: "1",
    branchName: "Head Office - Mumbai & Kolkata Technology Center",
    branchIds: ["1"],
    status: "Active",
    department: "Engineering",
    phone: "+91 98765 22222",
    password: "Password123",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01",
  },
  {
    id: "usr_client_acme",
    name: "Acme Corp (Client)",
    email: "client@saampark.in",
    role: "Clients",
    companyId: "tech",
    companyIds: ["tech"],
    companyName: "SAAMPARK Technology",
    branchId: "1",
    branchName: "Head Office - Mumbai & Kolkata Technology Center",
    branchIds: ["1"],
    status: "Active",
    department: "Client Accounts",
    phone: "+91 98765 33333",
    password: "Password123",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01",
    allowedModules: [
      "Dashboard",
      "Projects",
      "Subscriptions",
      "EMI",
      "Sales",
      "Estimates",
      "Messages",
      "Tickets",
      "Files",
      "Settings",
      "Leads",
    ],
  },
];

// Helper: get deleted user emails (synced from MySQL deleted table)
export async function getDeletedUserEmailsAsync(): Promise<string[]> {
  const deletedIds = await syncGlobalDeletedIds();
  return deletedIds.filter((id: string) => id.includes('@'));
}

export function getDeletedUserEmails(): string[] {
  const deleted = getLocalDeletedIds();
  return deleted.filter((id: string) => id.includes('@'));
}

// Helper: check if a specific user email has been deleted
export function isUserDeleted(email: string): boolean {
  if (!email) return false;
  const normEmail = email.toLowerCase().trim();
  return getDeletedUserEmails().includes(normEmail);
}

// Helper: mark a user email as permanently deleted (stored in MySQL via markGlobalItemDeleted)
export function markUserAsDeleted(email: string): void {
  if (!email) return;
  const normEmail = email.toLowerCase().trim();
  markGlobalItemDeleted(normEmail, "users").catch(() => {});
}

// Helper: unmark a user email as deleted
export function unmarkUserAsDeleted(email: string): void {
  if (!email) return;
  const normEmail = email.toLowerCase().trim();
  unmarkGlobalItemDeleted(normEmail);
}

// Helper: get user accounts — reads strictly from MySQL database
export async function getStoredUserAccountsAsync(): Promise<UserItem[]> {
  return getUsers("all");
}

/** @deprecated Use getStoredUserAccountsAsync() */
export function getStoredUserAccounts(): UserItem[] {
  console.warn("[userService] getStoredUserAccounts() is deprecated — use getStoredUserAccountsAsync() (async).");
  return DEFAULT_SYSTEM_ACCOUNTS;
}

// Helper: save user accounts to MySQL only (master 'all' company scope + sync company scopes)
export async function saveUserAccounts(accounts: UserItem[]): Promise<void> {
  await Promise.all([
    saveModuleDataToDB("users", accounts, "all"),
    saveModuleDataToDB("users", accounts, "tech"),
    saveModuleDataToDB("users", accounts, "consultancy"),
    saveModuleDataToDB("users", accounts, "digital")
  ]);
  // Bust users cache so next read always fetches fresh data after a write
  invalidateUsersCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("saampark_data_synced"));
  }
}

// Helper: check if an email is already registered
export async function isEmailRegistered(email: string): Promise<boolean> {
  const normEmail = email.toLowerCase().trim();
  if (isUserDeleted(normEmail)) return false;
  const accounts = await getStoredUserAccountsAsync();
  return accounts.some((acc) => acc.email.toLowerCase().trim() === normEmail);
}

// Helper: record a logged-in or newly created account into MySQL (Async version)
export async function recordUserAccountAsync(user: Partial<UserItem>, isNewRegistration = false): Promise<UserItem | null> {
  const normalizedEmail = (user.email || "").toLowerCase().trim();
  if (!normalizedEmail) return null;

  // Unmark email as deleted when recording/saving an active account
  unmarkUserAsDeleted(normalizedEmail);
  if (user.id) {
    unmarkGlobalItemDeleted(String(user.id).toLowerCase().trim());
  }

  let savedAccount: UserItem | null = null;
  let existing: UserItem | undefined = undefined;

  try {
    const currentAccounts = await fetchModuleDataFromDB<UserItem[]>("users", DEFAULT_SYSTEM_ACCOUNTS, "all");
    existing = currentAccounts.find(
      (acc) =>
        (user.id && String(acc.id) === String(user.id)) ||
        acc.email.toLowerCase().trim() === normalizedEmail
    );

    const prevEmail = (existing?.email || (user as any).previousEmail || "").toLowerCase().trim();
    const prevName = existing?.name;

    const currentPrev = Array.isArray(existing?.previousEmails)
      ? existing.previousEmails.map((pe) => (pe || "").toLowerCase().trim())
      : (existing?.previousEmail ? [(existing.previousEmail || "").toLowerCase().trim()] : []);

    const prevSet = new Set<string>(currentPrev);
    if (prevEmail && prevEmail !== normalizedEmail) {
      prevSet.add(prevEmail);
    }
    if ((user as any)?.previousEmails && Array.isArray((user as any).previousEmails)) {
      (user as any).previousEmails.forEach((pe: string) => {
        if (pe) {
          const peNorm = pe.toLowerCase().trim();
          if (peNorm !== normalizedEmail) prevSet.add(peNorm);
        }
      });
    }
    // Strict requirement: the active primary email MUST NEVER exist in its own previousEmails history!
    prevSet.delete(normalizedEmail);
    const prevEmailsList = Array.from(prevSet).filter(Boolean);

    const effCompId = user.companyId !== undefined ? user.companyId : (existing?.companyId || "tech");
    let resolvedCompName = user.companyName;
    if (!resolvedCompName) {
      if (user.companyId === undefined && existing?.companyName) {
        resolvedCompName = existing.companyName;
      } else {
        if (typeof window !== "undefined") {
          try {
            const { useAuthStore } = require("@/store/useAuthStore");
            const cObj = useAuthStore.getState().companies.find((c: any) => c.id?.toLowerCase() === effCompId.toLowerCase());
            if (cObj) resolvedCompName = cObj.brand_name || cObj.name;
          } catch {}
        }
        if (!resolvedCompName) {
          if (effCompId === "print") resolvedCompName = "Print Space India";
          else if (effCompId === "digital") resolvedCompName = "SAAMPARK Digital Marketing";
          else resolvedCompName = "SAAMPARK Technology";
        }
      }
    }

    const effBranchId = user.branchId !== undefined ? (user.branchId || undefined) : (existing?.branchId || undefined);
    let resolvedBranchName = user.branchName;
    if (!resolvedBranchName && effBranchId) {
      if (typeof window !== "undefined") {
        try {
          const { useAuthStore } = require("@/store/useAuthStore");
          const bObj = useAuthStore.getState().branches.find((b: any) => b.id === effBranchId || b.name.toLowerCase() === effBranchId.toLowerCase());
          if (bObj) resolvedBranchName = bObj.name;
        } catch {}
      }
    }

    // Build the account object safely preserving existing role and properties
    const mergedAccount: UserItem = {
      id: user.id || existing?.id || `usr_${Date.now()}`,
      name: user.name !== undefined ? user.name : (existing?.name || "User Account"),
      email: normalizedEmail,
      username: user.username !== undefined ? (user.username ? user.username.toLowerCase().trim() : undefined) : existing?.username,
      role: isRootSuperAdminEmail(normalizedEmail) ? "Super Admin" : (user.role !== undefined ? user.role : (existing?.role || "Teams")),
      companyId: effCompId,
      companyIds: user.companyIds !== undefined ? user.companyIds : (existing?.companyIds || (effCompId ? [effCompId] : ["tech"])),
      companyName: resolvedCompName,
      branchId: effBranchId,
      branchIds: user.branchIds !== undefined ? (user.branchIds || undefined) : (effBranchId ? [effBranchId] : (existing?.branchIds || undefined)),
      branchName: resolvedBranchName || (effBranchId ? existing?.branchName : undefined),
      avatarUrl: user.avatarUrl !== undefined ? user.avatarUrl : (existing?.avatarUrl || (user as any)?.avatar || existing?.avatar || undefined),
      avatar: (user as any)?.avatar !== undefined ? (user as any)?.avatar : (existing?.avatar || user.avatarUrl || existing?.avatarUrl || undefined),
      status: user.status !== undefined ? user.status : (existing?.status || "Active"),
      department: user.department !== undefined ? user.department : (existing?.department || "General"),
      phone: user.phone !== undefined ? user.phone : (existing?.phone || ""),
      password: user.password !== undefined ? user.password : (existing?.password || "Password123"),
      lastLogin: user.lastLogin !== undefined ? user.lastLogin : (existing?.lastLogin || "Just now"),
      joinedDate: user.joinedDate !== undefined ? user.joinedDate : (existing?.joinedDate || new Date().toISOString().split("T")[0]),
      permissions: (user as any).permissions !== undefined ? (user as any).permissions : existing?.permissions,
      allowedModules: (user as any).allowedModules !== undefined ? (user as any).allowedModules : existing?.allowedModules,
      kycStatus: user.kycStatus !== undefined ? user.kycStatus : (existing?.kycStatus || (user as any).kyc_status || "Pending"),
      kycData: user.kycData !== undefined ? user.kycData : (existing?.kycData || (user as any).kyc_data || undefined),
      previousEmails: prevEmailsList.length > 0 ? prevEmailsList : undefined,
      previousEmail: prevEmailsList.length > 0 ? prevEmailsList[prevEmailsList.length - 1] : undefined,
    };

    savedAccount = mergedAccount;

    // Strict 1:1 Email Uniqueness: Remove all other rows matching this ID or this email or previous email
    const cleaned = currentAccounts.filter((acc) => {
      const accId = String(acc.id || "").toLowerCase().trim();
      const targetId = String(user.id || "").toLowerCase().trim();
      const accEmail = (acc.email || "").toLowerCase().trim();
      if (targetId && accId === targetId) return false;
      if (accEmail === normalizedEmail) return false;
      if (prevEmailsList.includes(accEmail)) return false;
      return true;
    });

    if (prevName && prevName.trim() !== mergedAccount.name.trim()) {
      cascadeUserNameChange(prevName, normalizedEmail, mergedAccount.name).catch(() => {});
    }

    const updatedList = [mergedAccount, ...cleaned];
    await saveUserAccounts(updatedList);

    // ── CRITICAL FIX: also clean old/new email from company-specific scopes ──
    // getUsers() reads from "tech" and "digital" too; ghost records there cause duplicates.
    const scopesToClean = ["tech", "consultancy", "digital"];
    for (const scope of scopesToClean) {
      try {
        const scopeAccounts = await fetchModuleDataFromDB<UserItem[]>("users", [], scope);
        if (!Array.isArray(scopeAccounts) || scopeAccounts.length === 0) continue;
        const targetId = String(user.id || "").toLowerCase().trim();
        const scopeCleaned = scopeAccounts.filter((acc) => {
          const accId = String(acc.id || "").toLowerCase().trim();
          const accEmail = (acc.email || "").toLowerCase().trim();
          if (targetId && accId === targetId) return false;
          if (accEmail === normalizedEmail) return false;
          if (prevEmail && accEmail === prevEmail) return false;
          return true;
        });
        if (scopeCleaned.length !== scopeAccounts.length) {
          await saveModuleDataToDB("users", scopeCleaned, scope);
        }
      } catch {}
    }
  } catch (err) {
    console.warn("recordUserAccountAsync error:", err);
  }

  if (savedAccount) {
    if (isNewRegistration || !existing) {
      recordActivityLog({
        type: "user",
        module: "Users",
        action: "User Account Registered",
        description: `New user account "${savedAccount.name}" (${savedAccount.role}) registered`,
        companyId: savedAccount.companyId,
        branchId: savedAccount.branchId,
        branchName: savedAccount.branchName,
        details: `Email: ${savedAccount.email} | Role: ${savedAccount.role} | Department: ${savedAccount.department || "General"}`
      }).catch(() => {});
    } else if (existing) {
      recordActivityLog({
        type: "user",
        module: "Users",
        action: "User Account Updated",
        description: `User account "${savedAccount.name}" profile details updated`,
        companyId: savedAccount.companyId,
        branchId: savedAccount.branchId,
        branchName: savedAccount.branchName,
        details: `Email: ${savedAccount.email} | Role: ${savedAccount.role}`
      }).catch(() => {});
    }
  }

  invalidateUsersCache();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("saampark_data_synced"));
  }
  return savedAccount;
}


// Helper: record user account (sync wrapper)
export function recordUserAccount(user: Partial<UserItem>, isNewRegistration = false): UserItem | null {
  const normalizedEmail = (user.email || "").toLowerCase().trim();
  if (!normalizedEmail) return null;

  unmarkUserAsDeleted(normalizedEmail);
  if (user.id) {
    unmarkGlobalItemDeleted(String(user.id).toLowerCase().trim());
  }

  recordUserAccountAsync(user, isNewRegistration).catch(() => {});

  return {
    id: user.id || `usr_${Date.now()}`,
    name: user.name || "User Account",
    email: normalizedEmail,
    role: user.role !== undefined ? user.role : "Teams",
    companyId: user.companyId || "tech",
    companyIds: user.companyIds || (user.companyId ? [user.companyId] : ["tech"]),
    companyName: user.companyName || "SAAMPARK Technology",
    status: user.status || "Active",
    department: user.department || "General",
    phone: user.phone || "",
    password: user.password !== undefined ? user.password : "Password123",
    lastLogin: user.lastLogin || "Just now",
    joinedDate: user.joinedDate || new Date().toISOString().split("T")[0],
    permissions: (user as any).permissions,
    allowedModules: (user as any).allowedModules,
  };
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

// Helper: dynamically look up a user's real uploaded cloud avatar from the users database or active auth store
export function getUserAvatar(
  userIdentifier?: string | null,
  allUsers?: UserItem[],
  fallbackSeed?: string
): string {
  if (!userIdentifier || !userIdentifier.trim()) {
    return fallbackSeed ? `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(fallbackSeed)}` : "";
  }
  const norm = userIdentifier.toLowerCase().trim();

  // 1. Check current logged-in user in Auth Store
  try {
    const curUser = useAuthStore.getState().user;
    if (curUser) {
      const cEmail = (curUser.email || "").toLowerCase().trim();
      const cName = (curUser.name || "").toLowerCase().trim();
      const cId = String(curUser.id || "").toLowerCase().trim();
      if (norm === cEmail || norm === cName || norm === cId) {
        const curAv = (curUser as any).avatarUrl || curUser.avatar;
        if (curAv && curAv.trim() && !curAv.includes("dicebear")) {
          return curAv;
        }
      }
    }
  } catch {}

  // 2. Check candidate list (allUsers, or cached _usersCacheData, or DEFAULT_SYSTEM_ACCOUNTS)
  const candidateUsers: UserItem[] = (Array.isArray(allUsers) && allUsers.length > 0)
    ? allUsers
    : (_usersCacheData && _usersCacheData.length > 0)
      ? _usersCacheData
      : DEFAULT_SYSTEM_ACCOUNTS;

  if (candidateUsers.length > 0) {
    const matched = candidateUsers.find((u) => {
      const uEmail = (u.email || "").toLowerCase().trim();
      const uName = (u.name || "").toLowerCase().trim();
      const uId = String(u.id || "").toLowerCase().trim();
      return uEmail === norm || uName === norm || uId === norm;
    });

    if (matched) {
      const realAvatar = matched.avatarUrl || (matched as any).avatar;
      if (realAvatar && realAvatar.trim() && !realAvatar.includes("dicebear")) {
        return realAvatar;
      }
    }
  }

  // 3. Fallback check across DEFAULT_SYSTEM_ACCOUNTS if candidateUsers didn't include it
  const defMatched = DEFAULT_SYSTEM_ACCOUNTS.find((u) => {
    return (u.email || "").toLowerCase().trim() === norm || (u.name || "").toLowerCase().trim() === norm;
  });
  if (defMatched) {
    const defAv = defMatched.avatarUrl || (defMatched as any).avatar;
    if (defAv && defAv.trim() && !defAv.includes("dicebear")) {
      return defAv;
    }
  }

  // 4. If userIdentifier is already a real valid image URL
  if (userIdentifier.startsWith("http://") || userIdentifier.startsWith("https://") || userIdentifier.startsWith("data:")) {
    if (!userIdentifier.includes("dicebear")) {
      return userIdentifier;
    }
  }

  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(fallbackSeed || userIdentifier)}`;
}

// Cascade user avatar change across assigned Tasks, Leads, and Projects
export async function cascadeUserAvatarChange(name: string, email: string, newAvatarUrl: string): Promise<void> {
  if (!newAvatarUrl) return;
  const oNameNorm = (name || "").trim().toLowerCase();
  const emailNorm = (email || "").trim().toLowerCase();

  // 1. Tasks
  try {
    const tasks = await fetchModuleDataFromDB<any[]>("tasks", [], "all");
    let changed = false;
    const updated = tasks.map((t) => {
      const assignedTo = (t.assignedTo || "").toLowerCase().trim();
      const assignedToEmail = (t.assignedToEmail || "").toLowerCase().trim();
      if (assignedTo === oNameNorm || assignedTo === emailNorm || assignedToEmail === emailNorm) {
        changed = true;
        return { ...t, assignedToAvatar: newAvatarUrl };
      }
      return t;
    });
    if (changed) {
      await saveModuleDataToDB("tasks", updated, "all");
    }
  } catch (err) {
    console.warn("Cascade avatar tasks warning:", err);
  }

  // 2. Leads
  try {
    const leads = await fetchModuleDataFromDB<any[]>("leads", [], "all");
    let changed = false;
    const updated = leads.map((l) => {
      const assignedTo = (l.assignedTo || "").toLowerCase().trim();
      const caller = (l.caller || "").toLowerCase().trim();
      const owner = (l.owner || "").toLowerCase().trim();
      if (assignedTo === oNameNorm || assignedTo === emailNorm || caller === oNameNorm || owner === oNameNorm) {
        changed = true;
        return { ...l, ownerAvatar: newAvatarUrl, assignedToAvatar: newAvatarUrl };
      }
      return l;
    });
    if (changed) {
      await saveModuleDataToDB("leads", updated, "all");
    }
  } catch (err) {
    console.warn("Cascade avatar leads warning:", err);
  }

  // 3. Projects
  try {
    const projects = await fetchModuleDataFromDB<any[]>("projects", [], "all");
    let changed = false;
    const updated = projects.map((p) => {
      if (Array.isArray(p.members)) {
        let memberChanged = false;
        const updatedMembers = p.members.map((m: any) => {
          const mName = typeof m === "string" ? m : m.name;
          const mEmail = typeof m === "string" ? "" : (m.email || "");
          if ((mName && mName.toLowerCase().trim() === oNameNorm) || (mEmail && mEmail.toLowerCase().trim() === emailNorm)) {
            memberChanged = true;
            return typeof m === "string" ? { name: m, avatar: newAvatarUrl } : { ...m, avatar: newAvatarUrl, avatarUrl: newAvatarUrl };
          }
          return m;
        });
        if (memberChanged) {
          changed = true;
          return { ...p, members: updatedMembers };
        }
      }
      return p;
    });
    if (changed) {
      await saveModuleDataToDB("projects", updated, "all");
    }
  } catch (err) {
    console.warn("Cascade avatar projects warning:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("saampark_data_synced"));
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

  // ── CRITICAL FIX: also remove from all company-specific scopes ──
  const scopesToClean = ["tech", "digital", "infotech", "fashion", "consultancy", "jewellers"];
  for (const scope of scopesToClean) {
    try {
      const scopeAccounts = await fetchModuleDataFromDB<any[]>("users", [], scope);
      if (!Array.isArray(scopeAccounts) || scopeAccounts.length === 0) continue;
      const targetId = String(id).toLowerCase().trim();
      const scopeFiltered = scopeAccounts.filter((acc) => {
        const accEmail = (acc.email || "").toLowerCase().trim();
        const accId = String(acc.id || "").toLowerCase().trim();
        return accId !== targetId && (!normEmail || accEmail !== normEmail);
      });
      if (scopeFiltered.length !== scopeAccounts.length) {
        await saveModuleDataToDB("users", scopeFiltered, scope);
      }
    } catch {}
  }

  // Bust users cache so next read immediately sees the deletion
  invalidateUsersCache();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("saampark_data_synced"));

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

  const deletedUser = currentAccounts.find((acc) => {
    const accEmail = (acc.email || "").toLowerCase().trim();
    const accId = String(acc.id || "").toLowerCase().trim();
    const targetId = String(id).toLowerCase().trim();
    return accId === targetId || (normEmail && accEmail === normEmail);
  });

  recordActivityLog({
    type: "user",
    module: "Users",
    action: "User Account Deleted",
    description: `User account "${deletedUser?.name || id}" (${deletedUser?.email || normEmail || 'N/A'}) deleted`,
    companyId: deletedUser?.companyId,
    branchId: deletedUser?.branchId,
    branchName: deletedUser?.branchName,
    details: `Role: ${deletedUser?.role || "Teams"}`
  }).catch(() => {});

  return true;
}


// ── Users Cache ──────────────────────────────────────────────────────────────
// Prevents repeated API calls on every render — only fetches fresh when
// company/branch switches or after a write (add/edit/delete user).
const USERS_CACHE_TTL_MS = 60_000; // 1 minute
let _usersCacheData: UserItem[] | null = null;
let _usersCacheTime = 0;
let _usersCacheKey = ""; // tracks last company scope used

export function invalidateUsersCache(): void {
  _usersCacheData = null;
  _usersCacheTime = 0;
  _usersCacheKey = "";
}

// Listen for company/branch switch events to bust the cache automatically
if (typeof window !== "undefined") {
  const bustCache = () => invalidateUsersCache();
  window.addEventListener("saampark_company_switched", bustCache);
  window.addEventListener("saampark_branch_switched", bustCache);
  window.addEventListener("saampark_subbranch_switched", bustCache);
}
// ─────────────────────────────────────────────────────────────────────────────

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

  // 1. Fetch master user records from MySQL app_data DB ('users', 'all')
  const dbUsersBase = await fetchModuleDataFromDB<UserItem[]>("users", [], "all").catch(() => []);
  
  const isSuperAdminEmail = (email: string) => {
    const e = email.toLowerCase().trim();
    return e === "hiisupriya@gmail.com" || e === "supriyo.main@gmail.com" || e === "saampark.official@gmail.com";
  };

  const deletedEmails = (await getDeletedUserEmailsAsync()).map((e) => e.toLowerCase().trim());

  const userMap = new Map<string, UserItem>();
  
  // Collect existing IDs and emails in dbUsersBase to prevent default accounts from overwriting user changes
  const existingDbIds = (Array.isArray(dbUsersBase) ? dbUsersBase : []).map(u => String(u.id || '').toLowerCase().trim());
  const existingDbEmails = (Array.isArray(dbUsersBase) ? dbUsersBase : []).map(u => (u.email || '').toLowerCase().trim());
  const existingDbPrevEmails = (Array.isArray(dbUsersBase) ? dbUsersBase : []).flatMap(u => Array.isArray(u.previousEmails) ? u.previousEmails.map(pe => (pe || '').toLowerCase().trim()) : []);

  // 1. Seed base default accounts ONLY IF they haven't been modified/registered in the database or deleted
  for (const sysAcc of DEFAULT_SYSTEM_ACCOUNTS) {
    const sysId = String(sysAcc.id || '').toLowerCase().trim();
    const sysEmail = sysAcc.email.toLowerCase().trim();
    if (!existingDbIds.includes(sysId) && !existingDbEmails.includes(sysEmail) && !existingDbPrevEmails.includes(sysEmail)) {
      if (!deletedEmails.includes(sysEmail) && !isGlobalItemDeleted(sysId, undefined, "users") && !isGlobalItemDeleted(sysEmail, undefined, "users")) {
        userMap.set(sysEmail, sysAcc);
      }
    }
  }

  // 2. Merge master database accounts
  const mergeUserIntoMap = (u: UserItem) => {
    if (!u || !u.email) return;
    const eNorm = u.email.toLowerCase().trim();
    // 🛡️ PRIMARY ROOT SUPER ADMIN IMMUTABILITY:
    // saampark.official@gmail.com must ALWAYS be Super Admin, no one can demote it
    if (isRootSuperAdminEmail(eNorm)) {
      u.role = "Super Admin";
    }

    // Clean previousEmails on u so the active email is NEVER in its own history
    let currentPrev = Array.isArray(u.previousEmails)
      ? u.previousEmails.map((pe) => (pe || "").toLowerCase().trim())
      : (u.previousEmail ? [(u.previousEmail || "").toLowerCase().trim()] : []);

    currentPrev = currentPrev.filter((pe) => pe && pe !== eNorm);
    u.previousEmails = currentPrev.length > 0 ? currentPrev : undefined;
    u.previousEmail = currentPrev.length > 0 ? currentPrev[currentPrev.length - 1] : undefined;

    // Remove obsolete previous emails from userMap
    currentPrev.forEach((pe) => {
      userMap.delete(pe);
    });

    // If this user was transferred from an old email (like hiisupriya@gmail.com -> new email)
    // find if userMap has an entry with matching ID or matching previous email and remove it
    for (const [key, existing] of Array.from(userMap.entries())) {
      const existingId = String(existing.id || "").toLowerCase().trim();
      const targetId = String(u.id || "").toLowerCase().trim();
      const existingEmail = (existing.email || "").toLowerCase().trim();
      if (
        (targetId && existingId === targetId) ||
        (existingEmail && currentPrev.includes(existingEmail))
      ) {
        userMap.delete(key);
      }
    }

    userMap.set(eNorm, u);
  };

  for (const u of (Array.isArray(dbUsersBase) ? dbUsersBase : [])) {
    mergeUserIntoMap(u);
  }

  let dbUsers = Array.from(userMap.values());

  // Ensure currently logged-in user exists in dbUsers with their active current email
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
  // Use cache if data is fresh and same scope requested — avoids repeated API hits
  const cacheKey = companyId || "all";
  const now = Date.now();
  const cacheValid = _usersCacheData !== null && (now - _usersCacheTime) < USERS_CACHE_TTL_MS && _usersCacheKey === cacheKey;

  if (cacheValid) {
    return _usersCacheData!;
  }

  try {
    const res = await api.get("/users?company_id=all&branch_id=all&sub_branch_id=all");
    const rawData = Array.isArray(res) ? res : res?.data?.users || res?.data || [];
    if (Array.isArray(rawData) && rawData.length > 0) {
      rawData.forEach((u: any) => {
        const emailNorm = (u.email || "").toLowerCase().trim();
        const rawIdStr = String(u.id || "").toLowerCase().trim();
        if (emailNorm) {
          const existingIdx = dbUsers.findIndex((du) => 
            (rawIdStr && String(du.id).toLowerCase().trim() === rawIdStr) ||
            du.email.toLowerCase().trim() === emailNorm ||
            (Array.isArray(du.previousEmails) && du.previousEmails.map(e => e.toLowerCase().trim()).includes(emailNorm))
          );
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
          if (existingItem?.companyIds && existingItem.companyIds.length > 0) {
            parsedCompanyIds = existingItem.companyIds;
          } else if (u.company_ids) {
            try { parsedCompanyIds = JSON.parse(u.company_ids); } catch { parsedCompanyIds = [u.company_ids]; }
          }
          if (!Array.isArray(parsedCompanyIds) || parsedCompanyIds.length === 0) {
            parsedCompanyIds = [u.company_id || "tech"];
          }

          // If this account was already updated with a new primary email, keep the new primary email!
          const preservedEmail = existingItem?.email || emailNorm;
          const isRootSuper = isRootSuperAdminEmail(preservedEmail);
          const effectiveRole: UserRole = isRootSuper ? "Super Admin" : (mappedRole || existingItem?.role || finalRole);

          const item: UserItem = {
            id: String(u.id || existingItem?.id || `usr_${Math.random()}`),
            name: existingItem?.name || u.full_name || u.name || u.first_name || u.email || "User Account",
            email: preservedEmail,
            username: u.username || existingItem?.username || undefined,
            role: effectiveRole,
            companyId: u.company_id || parsedCompanyIds[0] || "tech",
            companyIds: parsedCompanyIds,
            companyName:
              u.company_name ||
              (parsedCompanyIds.includes("digital") && parsedCompanyIds.includes("tech")
                ? "SAAMPARK Group (Multiple)"
                : u.company_id === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
            branchId: u.branch_id || u.branchId || existingItem?.branchId || undefined,
            branchIds: u.branch_ids ? (() => { try { return JSON.parse(u.branch_ids) } catch { return [u.branch_ids] } })() : existingItem?.branchIds,
            branchName: u.branch_name || u.branchName || existingItem?.branchName || undefined,
            avatarUrl: u.avatar || u.avatarUrl || u.avatar_url || existingItem?.avatarUrl || undefined,
            status: u.status === "inactive" || u.is_active === false ? "Inactive" : "Active",
            department: u.department || existingItem?.department || "General",
            phone: u.phone || existingItem?.phone || "",
            password: existingItem?.password || (u as any)?.password || undefined,
            lastLogin: u.last_login || existingItem?.lastLogin || "Active session",
            joinedDate: u.created_at ? u.created_at.split("T")[0] : existingItem?.joinedDate || new Date().toISOString().split("T")[0],
            allowedModules: permObj?.allowedModules || existingItem?.allowedModules,
            kycStatus: u.kyc_status || u.kycStatus || existingItem?.kycStatus || "Pending",
            kycData: u.kyc_data ? (() => { try { return typeof u.kyc_data === 'string' ? JSON.parse(u.kyc_data) : u.kyc_data } catch { return undefined } })() : existingItem?.kycData,
            previousEmails: existingItem?.previousEmails,
            previousEmail: existingItem?.previousEmail,
          };

          if (existingIdx >= 0 && existingItem) {
            dbUsers[existingIdx] = {
              ...item,
              ...existingItem,
              email: preservedEmail,
              id: String(existingItem.id || u.id),
              name: existingItem.name || item.name,
              username: existingItem.username || u.username || item.username || undefined,
              avatarUrl: existingItem.avatarUrl || item.avatarUrl,
              companyIds: (existingItem.companyIds && existingItem.companyIds.length > 0) ? existingItem.companyIds : parsedCompanyIds,
              companyId: (existingItem.companyIds && existingItem.companyIds[0]) || existingItem.companyId || item.companyId,
              companyName:
                ((existingItem.companyIds || parsedCompanyIds).includes("digital") && (existingItem.companyIds || parsedCompanyIds).includes("tech"))
                  ? "SAAMPARK Group (Multiple)"
                  : ((existingItem.companyIds || parsedCompanyIds)[0] === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
              branchId: existingItem.branchId !== undefined ? existingItem.branchId : item.branchId,
              branchIds: existingItem.branchIds !== undefined ? existingItem.branchIds : item.branchIds,
              branchName: existingItem.branchName !== undefined ? existingItem.branchName : item.branchName,
              department: existingItem.department || item.department,
              role: isRootSuper ? "Super Admin" : (mappedRole || existingItem.role || item.role),
              status: existingItem.status || item.status,
              phone: existingItem.phone !== undefined ? existingItem.phone : item.phone,
              password: existingItem.password || item.password || undefined,
              permissions: existingItem.permissions !== undefined ? existingItem.permissions : (permObj || item.permissions),
              allowedModules: existingItem.allowedModules || permObj?.allowedModules || item.allowedModules,
              kycStatus: existingItem.kycStatus || item.kycStatus,
              kycData: existingItem.kycData || item.kycData,
              previousEmails: existingItem.previousEmails,
              previousEmail: existingItem.previousEmail,
            };
          } else {
            dbUsers.push(item);
          }
        }
      });
    }
  } catch (err) {
    console.warn("Live API /users read warning:", err);
  }

  // Keep usePermissionStore synchronized with all dbUsers permissions
  dbUsers.forEach((u) => {
    const userIdStr = String(u.id);
    const emailNorm = (u.email || "").toLowerCase().trim();
    let permObj: any = u.permissions;
    if (typeof permObj === "string") {
      try { permObj = JSON.parse(permObj); } catch {}
    }
    const allowed = u.allowedModules || (permObj && Array.isArray(permObj.allowedModules) ? permObj.allowedModules : undefined);
    const actions = (permObj && permObj.actionMatrix) || undefined;

    if (allowed && Array.isArray(allowed)) {
      usePermissionStore.getState().setUserPermissions(userIdStr, allowed);
      if (emailNorm) usePermissionStore.getState().setUserPermissions(emailNorm, allowed);
    }
    if (actions && typeof actions === "object") {
      usePermissionStore.getState().setUserAllModuleActions(userIdStr, actions);
      if (emailNorm) usePermissionStore.getState().setUserAllModuleActions(emailNorm, actions);
    }
  });

  // 3. Collect all obsolete transferred emails across all active users
  const obsoleteEmailsSet = new Set<string>();
  dbUsers.forEach((u) => {
    const currentEmail = (u.email || "").toLowerCase().trim();
    if (Array.isArray(u.previousEmails)) {
      u.previousEmails.forEach((pe) => {
        if (pe) {
          const peNorm = pe.toLowerCase().trim();
          if (peNorm !== currentEmail) {
            obsoleteEmailsSet.add(peNorm);
          }
        }
      });
    }
    if (u.previousEmail) {
      const peNorm = u.previousEmail.toLowerCase().trim();
      if (peNorm !== currentEmail) {
        obsoleteEmailsSet.add(peNorm);
      }
    }
  });

  // Filter out hidden master admin account and any obsolete transferred emails or deleted users
  const activeValidUsers = dbUsers.filter((u) => {
    const emailNorm = (u.email || "").toLowerCase().trim();
    const uId = String(u.id || "").toLowerCase().trim();
    if (!emailNorm) return false;
    if (obsoleteEmailsSet.has(emailNorm)) return false;
    if (deletedEmails.includes(emailNorm)) return false;
    if (isGlobalItemDeleted(uId, undefined, "users") || isGlobalItemDeleted(emailNorm, undefined, "users")) return false;
    return true;
  });

  // Strictly enforce 1:1 email uniqueness
  const uniqueUsersMap = new Map<string, UserItem>();
  activeValidUsers.forEach((u) => {
    const emailNorm = (u.email || "").toLowerCase().trim();
    if (!uniqueUsersMap.has(emailNorm)) {
      uniqueUsersMap.set(emailNorm, u);
    } else {
      const existing = uniqueUsersMap.get(emailNorm)!;
      uniqueUsersMap.set(emailNorm, {
        ...existing,
        ...u,
        role: u.role || existing.role,
        companyIds: (u.companyIds && u.companyIds.length > 0) ? u.companyIds : existing.companyIds,
      });
    }
  });

  const cleanUsers = Array.from(uniqueUsersMap.values());
  saveModuleDataToDB("users", cleanUsers, "all").catch(() => {});

  // Store result in cache
  _usersCacheData = cleanUsers;
  _usersCacheTime = Date.now();
  _usersCacheKey = cacheKey;

  if (!companyId || companyId === "all") {
    return cleanUsers;
  }

  const targetComp = String(companyId).toLowerCase().trim();

  return cleanUsers.filter((u) => {
    const uCompIds = (u.companyIds && u.companyIds.length > 0)
      ? u.companyIds.map(id => String(id).toLowerCase().trim())
      : [String(u.companyId || "tech").toLowerCase().trim()];
    if (u.companyName) {
      uCompIds.push(String(u.companyName).toLowerCase().trim());
    }

    return uCompIds.includes(targetComp);
  });
}

export async function checkUsernameAvailabilityAsync(
  username: string,
  currentUserIdOrEmail?: string
): Promise<{ available: boolean; message: string }> {
  const raw = (username || "").toLowerCase().replace(/^@/, "").trim();
  if (!raw) {
    return { available: false, message: "Username cannot be empty." };
  }
  if (raw.length < 3 || raw.length > 30) {
    return { available: false, message: "Username must be between 3 and 30 characters." };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(raw)) {
    return { available: false, message: "Only letters, numbers, and underscores are allowed." };
  }

  const reserved = ["admin", "superadmin", "root", "support", "help", "api", "saampark", "login", "null", "undefined"];
  if (reserved.includes(raw)) {
    return { available: false, message: "This username is reserved." };
  }

  try {
    const res: any = await api.get(
      `/auth/check-username/${encodeURIComponent(raw)}?excludeEmail=${encodeURIComponent(currentUserIdOrEmail || "")}&excludeId=${encodeURIComponent(currentUserIdOrEmail || "")}`
    );
    if (res && typeof res.available === "boolean") {
      return res;
    }
  } catch {}

  // Fallback checking against allUsers in local store
  const allUsers = await getUsers("all");
  const currentNorm = (currentUserIdOrEmail || "").toLowerCase().trim();
  const match = allUsers.find(
    (u) =>
      u.username &&
      u.username.toLowerCase().replace(/^@/, "").trim() === raw &&
      u.email.toLowerCase().trim() !== currentNorm &&
      String(u.id).toLowerCase().trim() !== currentNorm
  );

  if (match) {
    return { available: false, message: "Username is already taken." };
  }

  return { available: true, message: "Username is available!" };
}

export async function updateUserUsernameAsync(
  idOrEmail: string,
  newUsername: string
): Promise<{ success: boolean; message: string; user?: UserItem }> {
  const normUser = String(idOrEmail).toLowerCase().trim();
  const cleanUsername = (newUsername || "").toLowerCase().replace(/^@/, "").trim();

  const availability = await checkUsernameAvailabilityAsync(cleanUsername, normUser);
  if (!availability.available && availability.message !== "This is your current username.") {
    return { success: false, message: availability.message };
  }

  try {
    await api.put(`/users/${encodeURIComponent(normUser)}`, {
      username: cleanUsername,
    }).catch(() => {});
  } catch {}

  const updated = await updateUser(normUser, { username: cleanUsername });
  if (updated) {
    const { useAuthStore } = require("@/store/useAuthStore");
    const curUser = useAuthStore.getState().user;
    if (curUser && (String(curUser.id) === normUser || curUser.email?.toLowerCase().trim() === normUser)) {
      useAuthStore.setState({
        user: {
          ...curUser,
          username: cleanUsername,
        },
      });
    }
    return { success: true, message: "Username updated successfully!", user: updated };
  }

  return { success: false, message: "Failed to update username." };
}

export async function updateUser(idOrEmail: string, updates: Partial<UserItem>, companyId?: string): Promise<UserItem | null> {
  const norm = String(idOrEmail).toLowerCase().trim();
  if (!norm) return null;

  const allUsers = await getUsers("all");
  const idx = allUsers.findIndex((u) => {
    const uEmail = (u.email || "").toLowerCase().trim();
    const uId = String(u.id || "").toLowerCase().trim();
    return uEmail === norm || uId === norm;
  });

  if (idx === -1) {
    return recordUserAccountAsync({ ...updates, id: idOrEmail }, false);
  }

  const existing = allUsers[idx];
  const newAvatar = updates.avatarUrl !== undefined ? updates.avatarUrl : (updates as any).avatar;
  const updated: UserItem = {
    ...existing,
    ...updates,
    id: existing.id,
    email: updates.email || existing.email,
    username: updates.username !== undefined ? updates.username : existing.username,
    branchId: updates.branchId !== undefined ? (updates.branchId || undefined) : existing.branchId,
    branchName: updates.branchName !== undefined ? (updates.branchName || undefined) : existing.branchName,
    branchIds: updates.branchIds !== undefined ? updates.branchIds : (updates.branchId ? [updates.branchId] : existing.branchIds),
    avatarUrl: newAvatar !== undefined ? newAvatar : existing.avatarUrl,
    avatar: newAvatar !== undefined ? newAvatar : (existing as any).avatar,
  };

  if (newAvatar && newAvatar !== existing.avatarUrl && newAvatar !== (existing as any).avatar) {
    cascadeUserAvatarChange(updated.name, updated.email, newAvatar).catch(() => {});
  }

  if (isRootSuperAdminEmail(existing.email) || isRootSuperAdminEmail(updated.email)) {
    updated.role = "Super Admin";
  }

  // Sync to live backend /users endpoint
  try {
    await api.put(`/users/${encodeURIComponent(existing.id || norm)}`, {
      avatar_url: newAvatar || undefined,
      avatar: newAvatar || undefined,
      avatarUrl: newAvatar || undefined,
      full_name: updated.name,
      phone: updated.phone,
      department: updated.department,
      branch_id: updated.branchId || null,
      branch_name: updated.branchName || null,
      branchName: updated.branchName || null,
      sub_branch_id: updated.subBranchId || null,
      sub_branch_name: updated.subBranchName || null,
      role: updated.role,
      role_id: updated.role === "Super Admin" ? 1 : updated.role === "Admin" ? 2 : updated.role === "Clients" ? 4 : 3,
      status: updated.status,
      permissions: updated.permissions || (updated.allowedModules ? { allowedModules: updated.allowedModules } : undefined),
      company_id: updated.companyId,
      company_ids: updated.companyIds,
    }).catch(() => {});
  } catch {}

  // Live update active session if current logged-in user is updated
  try {
    const curUser = useAuthStore.getState().user;
    if (curUser && (String(curUser.id) === String(existing.id) || curUser.email?.toLowerCase().trim() === norm)) {
      useAuthStore.setState({
        user: {
          ...curUser,
          avatarUrl: newAvatar || curUser.avatarUrl,
          avatar: newAvatar || curUser.avatar,
          name: updated.name,
        }
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("crm_avatar_changed", { detail: { avatar: newAvatar } }));
      }
    }
  } catch {}

  allUsers[idx] = updated;

  await saveModuleDataToDB("users", allUsers, "all");
  if (companyId && companyId !== "all") {
    await saveModuleDataToDB("users", allUsers, companyId);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"));
    window.dispatchEvent(new Event("saampark_users_updated"));
    window.dispatchEvent(new Event("saampark_team_members_updated"));
    window.dispatchEvent(new Event("storage"));
  }

  return updated;
}

export async function createTeamMember(memberData: Partial<UserItem>, companyId?: string): Promise<UserItem> {
  const comp = companyId || memberData.companyId || "tech";
  const newId = `usr_tm_${Date.now()}`;
  const name = memberData.name || "Team Member";
  const email = (memberData.email || `team_${Date.now()}@saampark.com`).toLowerCase().trim();
  const rawAv = memberData.avatarUrl || (memberData as any).avatar;

  const newMember: UserItem = {
    id: newId,
    name,
    email,
    phone: memberData.phone || "+91 98765 43210",
    role: (memberData.role || "Teams") as any,
    department: memberData.department || "Operations & Delivery",
    companyId: comp,
    companyIds: [comp],
    companyName: comp === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology",
    branchId: memberData.branchId,
    branchName: memberData.branchName,
    status: memberData.status || "Active",
    avatarUrl: rawAv || getUserAvatar(name, undefined, name),
    avatar: rawAv || undefined,
    joinedDate: new Date().toISOString().split("T")[0],
    lastLogin: "Never",
  };

  // Sync to live backend /users endpoint which sends welcome credentials email
  if (email && !email.includes("@saampark.com")) {
    api.post("/users", {
      full_name: name,
      email,
      password: "Password123",
      role_id: 3,
      role: "Teams",
      company_id: comp,
      company_ids: [comp],
      branch_id: memberData.branchId || null,
      department: memberData.department || "Operations & Delivery",
      phone: memberData.phone || "",
      avatar_url: rawAv || undefined,
    }).catch((err) => console.warn("Backend user create warning for team member:", err));
  }

  const allUsers = await getUsers("all");
  const nextList = [newMember, ...allUsers];

  await saveModuleDataToDB("users", nextList, "all");
  if (comp !== "all") {
    await saveModuleDataToDB("users", nextList, comp);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_data_synced"));
    window.dispatchEvent(new Event("saampark_users_updated"));
    window.dispatchEvent(new Event("saampark_team_members_updated"));
    window.dispatchEvent(new Event("storage"));
  }

  return newMember;
}




