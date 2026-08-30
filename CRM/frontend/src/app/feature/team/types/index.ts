export type PayoutStatus = "Need to Pay" | "Paid" | "Partial" | "On Hold"
export type PaymentMethod = "Bank IMPS/NEFT" | "UPI Transfer" | "Cash" | "Cheque"
export type PayoutType = "Monthly Salary" | "Subscription Commission" | "Bonus / Incentive" | "Advance" | "Full Settlement"

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
  subbranchName?: string
  
  // Banking & UPI
  bankingInfo: TeamMemberBankingInfo
  
  // Financial breakdown
  baseSalary: number
  subscriptionCommission: number
  totalDueThisMonth: number
  totalPaidThisMonth: number
  remainingNeedToPay: number
  
  // Status
  payoutStatus: PayoutStatus
  lastPaidDate?: string
  lastPaidAmount?: number
  nextPayoutDueDate?: string
  activeSubscriptionsCount: number
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
  
  period: string // e.g. "August 2026", "Week 34, 2026"
  payoutType: PayoutType
  baseAmount: number
  commissionAmount: number
  deductions?: number
  bonus?: number
  netAmount: number
  netAmountFormatted: string
  
  paymentDate: string // DD/MM/YYYY
  paymentMethod: PaymentMethod
  transactionRef?: string // UTR / Txn Reference
  
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

export interface TeamPayrollKPIs {
  totalMonthlyPayroll: number
  totalPaidThisMonth: number
  totalNeedToPay: number
  teamMembersOnPayroll: number
  paidMembersCount: number
  pendingMembersCount: number
}
