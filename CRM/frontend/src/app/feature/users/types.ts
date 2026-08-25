export type UserRole = "Super Admin" | "Admin" | "Clients" | "Teams";

export type UserStatus = "Active" | "Inactive" | "Pending";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string; // Primary/initial company e.g. "tech", "digital"
  companyIds?: string[]; // Multiple assigned companies e.g. ["tech", "digital"]
  companyName: string; // Display company name
  branchId?: string; // Assigned specific branch
  branchIds?: string[]; // Multiple assigned branches
  branchName?: string; // Display branch name
  status: UserStatus;
  avatarUrl?: string;
  department?: string;
  phone?: string;
  password?: string;
  lastLogin?: string;
  joinedDate: string;
  allowedModules?: string[];
  permissions?: any;
}

export type User = UserItem;

