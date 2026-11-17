export type ProjectType =
  | "Client Project"
  | "Internal Project"
  | "Digital Marketing Campaign";
export type ProjectStatus =
  | "Payment Pending"
  | "Open"
  | "In Progress"
  | "Completed"
  | "Hold"
  | "Finished"
  | "Cancelled"
  | "Under Review";

export interface ProjectMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email?: string;
  sharePercentage?: number; // Revenue share percentage against this project (e.g. 15 for 15%)
  payoutType?: "percentage" | "fixed";
  payoutValue?: number;
  payoutAmount?: number;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  stage:
    | "Frontend"
    | "Backend"
    | "Design"
    | "Testing"
    | "Deployment"
    | "Credentials"
    | "Custom";
  status: "Completed" | "In Progress" | "Pending" | "Hold";
  notes?: string;
  credentials?: string;
  updatedBy?: string;
  updatedAt?: string;
  developer?: string;
  date?: string;
}

export interface TaskBreakdown {
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

export interface ActivityItem {
  id: string;
  user: string;
  timestamp: string;
  action: string;
  title: string;
  badge?: string;
}

export interface Project {
  id: string;
  title: string;
  projectType: ProjectType;
  client: string;
  price: string;
  startDate: string;
  deadline: string;
  progress: number;
  status: ProjectStatus;
  labels: string[];
  description?: string;
  starred?: boolean;
  totalHours?: number;
  paymentStatus?:
    | "Payment Pending"
    | "Paid"
    | "Advance Received"
    | "Partially Paid";
  paymentStructure?: "Full" | "Advance + Part Payment";
  advanceAmount?: number;
  dueAmount?: number;
  installmentsCount?: number;
  installmentAmount?: number;
  subscriptionId?: string;
  baseAmount?: number;
  setupCharge?: number;
  discount?: number;
  gstRate?: number;
  gstAmount?: number;
  totalAmount?: number;
  items?: any[];
  discountsList?: any[];
  billedBy?: string;
  clientId?: string;
  createdById?: string;
  createdByEmail?: string;
  members?: ProjectMember[];
  milestones?: ProjectMilestone[];
  taskBreakdown?: TaskBreakdown;
  activityLogs?: ActivityItem[];
  companyId?: string;
  branchId?: string;
  branchName?: string;
  branchCode?: string;
  subBranchId?: string;
  subBranchName?: string;
  subBranchCode?: string;
  quotationId?: string;
  quotationNumber?: string;
  quotationData?: any;
  estimateId?: string;
  estimateNumber?: string;
  estimateData?: any;
  marketingPackage?: any;
  category?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  paidAmount?: number;
  techStack?: string[];
  gitUrl?: string;
  liveUrl?: string;
  hostingEnvironment?: string;
  scopeDeliverables?: string;
  completedAt?: string;
  countdownStartDate?: string;
  countdownEndDate?: string;
  planDuration?: string;
  planType?: string;
  firstPostDate?: string;
  clientEmail?: string;
  clientName?: string;
  clientPhone?: string;
  customer?: string;
  customerEmail?: string;
  developer?: string;
  marketingRetainer?: {
    planTier?: string;
    postersQuota?: number;
    reelsQuota?: number;
    shootDate?: string;
    shootLocation?: string;
    targetGeo?: string;
    monthlyAdBudget?: number;
    driveUrl?: string;
    createdAt?: string;
  };
}

export const isMarketingProject = (p: any): boolean => {
  if (!p) return false;
  const cat = String(p.category || "").toLowerCase();
  const pTitle = String(p.title || "").toLowerCase();
  const isTech =
    cat.includes("website") ||
    cat.includes("software") ||
    cat.includes("app") ||
    cat.includes("android") ||
    cat.includes("ios") ||
    pTitle.includes("cab booking") ||
    pTitle.includes("website") ||
    pTitle.includes("app") ||
    pTitle.includes("system");
  if (isTech) return false;
  const pLabels = Array.isArray(p.labels) ? p.labels : [];
  return (
    p.projectType === "Digital Marketing Campaign" ||
    Boolean(p.marketingPackage?.enabled) ||
    pLabels.includes("Digital Marketing") ||
    cat.includes("marketing")
  );
};
