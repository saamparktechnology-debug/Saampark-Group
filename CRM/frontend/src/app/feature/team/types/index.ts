export type PayoutStatus = "Need to Pay" | "Paid" | "Partial" | "On Hold"
export type PaymentMethod = "Bank IMPS/NEFT" | "UPI Transfer" | "Cash" | "Cheque"
export type PayoutType = "Monthly Salary" | "Subscription Commission" | "Project Share / Milestone Payout" | "Bonus / Incentive" | "Advance" | "Custom Allowance" | "Custom Amount" | "Expense Reimbursement" | "Full Settlement"

export interface TeamMemberBankingInfo {
  memberId: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  accountHolderName?: string
  upiId?: string // e.g. user@icici or 9876543210@paytm
  panNumber?: string
  aadhaarNumber?: string
  baseSalary?: number // Monthly base compensation
  notes?: string
}

export interface TeamMemberPayoutProfile {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string
  role: string
  department: string
  companyId?: string
  branchId?: string
  branchName?: string
  subBranchId?: string
  subbranchName?: string
  
  // Banking & UPI
  bankingInfo: TeamMemberBankingInfo
  
  // Financial breakdown
  baseSalary: number
  subscriptionCommission: number
  projectEarnings: number
  totalDueThisMonth: number
  totalPaidThisMonth: number
  remainingNeedToPay: number
  
  // Status
  payoutStatus: PayoutStatus
  lastPaidDate?: string
  lastPaidAmount?: number
  nextPayoutDueDate?: string
  activeSubscriptionsCount: number
  activeProjectsCount: number
}

export interface TeamPayoutRecord {
  id: string // e.g. PAY-TEAM-2026-0001
  memberId: string
  memberName: string
  memberEmail: string
  memberPhone?: string
  role?: string
  department?: string
  companyId?: string
  branchId?: string
  branchName?: string
  subBranchId?: string
  subbranchName?: string
  
  period: string // e.g. "August 2026", "Week 34, 2026"
  payoutType: PayoutType
  baseAmount: number
  commissionAmount: number
  projectAmount?: number
  deductions?: number
  bonus?: number
  netAmount: number
  netAmountFormatted: string
  
  paymentDate: string // DD/MM/YYYY
  paymentMethod: PaymentMethod
  transactionRef?: string // UTR / Txn Reference
  projectId?: string
  projectTitle?: string
  
  bankDetailsUsed?: {
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    accountHolderName?: string
    upiId?: string
  }
  
  status: "Completed" | "Pending" | "Failed"
  notes?: string
  receiptSentAt?: string
  receiptSentTo?: string
  billedBy?: string
  createdAt?: string
}

export interface ProjectUserEarningsRecord {
  id: string
  projectId: string
  projectTitle: string
  clientName: string
  projectTotalValue: number
  clientPaymentReceived: number
  clientPaymentStatus: string
  
  memberId: string
  memberName: string
  memberEmail: string
  memberRole: string
  memberSharePercentage: number // e.g. 15%
  memberTotalEarned: number // (clientPaymentReceived * sharePct) / 100
  memberPaidAmount: number
  memberPendingAmount: number
  
  companyId?: string
  branchId?: string
  branchName?: string
  subBranchId?: string
  subbranchName?: string
  lastDisbursedDate?: string
}

export type CustomAdjustmentCategory = 
  | "Travel Reimbursement" 
  | "Tech & Hardware Allowance" 
  | "Performance Bonus" 
  | "Salary Advance" 
  | "Overtime & Weekend Delivery" 
  | "Daily Calling Incentive"
  | "Custom Credit" 
  | "Custom Deduction"

export interface CustomPaymentAdjustment {
  id: string // e.g. ADJ-2026-0001
  memberId: string
  memberName: string
  memberEmail: string
  role?: string
  department?: string
  
  category: CustomAdjustmentCategory
  type: "Credit" | "Debit"
  amount: number
  description: string
  status: "Pending" | "Approved" | "Disbursed" | "Rejected"
  
  createdDate: string
  disbursedDate?: string
  voucherId?: string
  companyId?: string
  branchId?: string
  branchName?: string
  subBranchId?: string
  subbranchName?: string
  approvedBy?: string
}

export interface TeamPayrollKPIs {
  totalMonthlyPayroll: number
  totalPaidThisMonth: number
  totalNeedToPay: number
  teamMembersOnPayroll: number
  paidMembersCount: number
  pendingMembersCount: number
  totalProjectDisbursements: number
  totalCustomAdjustments: number
}
