export type UserRole = "Super Admin" | "Admin" | "Clients" | "Teams";
export type UserStatus = "Active" | "Inactive" | "Pending";

export type KycStatus = "Pending" | "Processing" | "Verified" | "Rejected";

export interface KycData {
  fullName: string;
  docType: "Aadhaar Card" | "PAN Card" | "Passport" | "Voter ID" | "Driving License";
  docNumber: string;
  docFrontUrl?: string;
  docBackUrl?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  upiId?: string;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  companyId: string; // Primary/initial company e.g. "tech", "digital"
  companyIds?: string[]; // Multiple assigned companies e.g. ["tech", "digital"]
  companyName: string; // Display company name
  branchId?: string; // Assigned specific branch
  branchIds?: string[]; // Multiple assigned branches
  branchName?: string; // Display branch name
  subBranchId?: string; // Assigned specific sub-branch
  subBranchIds?: string[]; // Multiple assigned sub-branches
  subBranchName?: string; // Display sub-branch name
  sub_branch_id?: string;
  sub_branch_name?: string;
  branch_id?: string;
  status: UserStatus;
  avatarUrl?: string;
  avatar?: string;
  department?: string;
  phone?: string;
  password?: string;
  lastLogin?: string;
  joinedDate: string;
  allowedModules?: string[];
  permissions?: any;
  kycStatus?: KycStatus;
  kycData?: KycData;
  previousEmails?: string[];
  previousEmail?: string;
}

export type User = UserItem;

