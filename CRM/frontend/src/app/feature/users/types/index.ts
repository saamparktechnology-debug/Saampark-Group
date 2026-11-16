export type UserRole = "Super Admin" | "Admin" | "Clients" | "Teams";
export type UserStatus = "Active" | "Inactive" | "Pending";

export type KycStatus = "Pending" | "Processing" | "Verified" | "Rejected";

export interface EmergencyContactInfo {
  name: string;
  relation: string; // e.g. "Father", "Mother", "Spouse", "Brother", "Sister", "Son", "Daughter", "Guardian", "Friend", "Relative", "Other"
  customRelation?: string;
  phone: string;
}

export interface AddressInfo {
  pincode: string;
  state: string;
  district: string;
  city: string;
  postOffice?: string;
  streetAddress: string;
  landmark?: string;
  fullAddress: string;
}

export interface KycData {
  fullName: string;
  fatherOrGuardianName?: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other" | string;
  maritalStatus?: "Single" | "Married" | "Other" | string;
  bloodGroup?: string;
  passportPhotoUrl?: string;

  // Emergency Contacts 1 & 2
  emergencyContact1?: EmergencyContactInfo;
  emergencyContact2?: EmergencyContactInfo;

  // Addresses
  currentAddress?: AddressInfo;
  permanentAddress?: AddressInfo;
  isPermanentSameAsCurrent?: boolean;

  // Primary Govt ID
  docType: "Aadhaar Card" | "PAN Card" | "Passport" | "Voter ID" | "Driving License" | string;
  docNumber: string;
  docFrontUrl?: string;
  docBackUrl?: string;

  // Optional PAN card if primary ID is not PAN
  panNumber?: string;
  panDocUrl?: string;

  // Bank & Salary Remittance
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  bankBranch?: string;
  upiId?: string;
  bankProofUrl?: string; // Bank passbook / statement / cancelled cheque

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
  designation?: string;
  employeeId?: string;
  salary?: number;
  ctc?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  address?: string;
  offerLetterSentAt?: string;
  idCardIssuedAt?: string;
}

export type User = UserItem;

