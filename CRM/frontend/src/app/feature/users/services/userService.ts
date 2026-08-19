import { UserItem } from "../types";
import { api } from "@/lib/api";

const STORAGE_KEY = "saampark_registered_accounts";

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
    role: "User",
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

// Helper to get persistent registered/logged-in users from localStorage
export function getStoredUserAccounts(): UserItem[] {
  if (typeof window === "undefined") return DEFAULT_SYSTEM_ACCOUNTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed initial default system accounts
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SYSTEM_ACCOUNTS));
      return DEFAULT_SYSTEM_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SYSTEM_ACCOUNTS;
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
  const accounts = getStoredUserAccounts();
  return accounts.some(
    (acc) => acc.email.toLowerCase().trim() === email.toLowerCase().trim()
  );
}

// Helper to record a logged-in or newly created account
export function recordUserAccount(user: Partial<UserItem>): UserItem {
  const currentAccounts = getStoredUserAccounts();
  const normalizedEmail = (user.email || "").toLowerCase().trim();

  const existingIndex = currentAccounts.findIndex(
    (acc) => acc.email.toLowerCase().trim() === normalizedEmail
  );

  const updatedAccount: UserItem = {
    id: user.id || (existingIndex >= 0 ? currentAccounts[existingIndex].id : `usr_${Date.now()}`),
    name: user.name || (existingIndex >= 0 ? currentAccounts[existingIndex].name : "User Account"),
    email: normalizedEmail,
    role: user.role || (existingIndex >= 0 ? currentAccounts[existingIndex].role : "Employee"),
    companyId: user.companyId || (existingIndex >= 0 ? currentAccounts[existingIndex].companyId : "tech"),
    companyName:
      user.companyName ||
      (user.companyId === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
    status: user.status || "Active",
    department: user.department || (existingIndex >= 0 ? currentAccounts[existingIndex].department : "General"),
    phone: user.phone || (existingIndex >= 0 ? currentAccounts[existingIndex].phone : ""),
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
  return updatedAccount;
}

// Fetch user accounts
export async function getUsers(companyId?: string): Promise<UserItem[]> {
  let liveUsers: UserItem[] = [];

  try {
    // Attempt live API fetch from /users
    const res = await api.get("/users");
    const rawData = Array.isArray(res) ? res : res?.data?.users || res?.data || [];

    if (Array.isArray(rawData) && rawData.length > 0) {
      liveUsers = rawData.map((u: any) => ({
        id: String(u.id || `usr_${Math.random()}`),
        name: u.full_name || u.name || u.first_name || u.email || "User Account",
        email: (u.email || "").toLowerCase().trim(),
        role: (u.role || u.role_name || "Employee") as any,
        companyId: u.company_id || u.companyId || "tech",
        companyName:
          u.company_name ||
          (u.company_id === "digital" ? "SAAMPARK Digital Marketing" : "SAAMPARK Technology"),
        status: u.is_active === false ? "Inactive" : "Active",
        department: u.department || "Operations",
        phone: u.phone || "",
        lastLogin: u.last_login || "Active session",
        joinedDate: u.created_at ? u.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
      }));

      // Merge live API users into local store
      liveUsers.forEach((user) => recordUserAccount(user));
    }
  } catch (err) {
    console.warn("Live API /users check:", err);
  }

  // Combine stored persistent user accounts
  const storedAccounts = getStoredUserAccounts();

  // Deduplicate by email
  const allAccountsMap = new Map<string, UserItem>();
  liveUsers.forEach((u) => allAccountsMap.set(u.email.toLowerCase(), u));
  storedAccounts.forEach((u) => {
    if (!allAccountsMap.has(u.email.toLowerCase())) {
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
