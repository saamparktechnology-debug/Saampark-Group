export type UserRole = "Super Admin" | "Admin" | "Clients" | "Teams" | "User";

export type UserStatus = "Active" | "Inactive" | "Pending";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string; // e.g. "tech", "digital", "all"
  companyName: string; // e.g. "SAAMPARK Technology"
  status: UserStatus;
  avatarUrl?: string;
  department?: string;
  phone?: string;
  lastLogin?: string;
  joinedDate: string;
  allowedModules?: string[];
}
