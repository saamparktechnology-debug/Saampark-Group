export type BillingCycle = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Half-Yearly" | "Annually" | "Custom Days"

export type SubscriptionStatus = "Active" | "Expiring Soon" | "Past Due" | "Canceled" | "Trial"

export type InstallmentStatus = "Paid" | "Pending" | "Overdue" | "Partially Paid"

export interface InstallmentScheduleItem {
  installmentNumber: number
  amount: number
  formattedAmount: string
  dueDate: string
  status: InstallmentStatus
  paidDate?: string
  paidAmount?: number
  invoiceId?: string
  paymentMethod?: string
  reminderSentAt?: string
  notes?: string
}

export interface InstallmentItem {
  id: string
  projectId?: string
  invoiceId?: string
  contractId?: string
  clientId?: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientCompany?: string
  clientGst?: string
  projectTitle: string
  totalContractValue: number
  totalAdvancePaid: number
  totalPaid: number
  remainingBalance: number
  totalInstallments: number
  currentInstallmentNumber: number
  currentInstallmentAmount: number
  currentDueDate: string
  status: InstallmentStatus
  schedule: InstallmentScheduleItem[]
  companyId?: string
  branchId?: string
  branchName?: string
  assignedMembers?: string[]
  assignedMemberEmails?: string[]
  billedBy?: string
  createdById?: string
  createdAt?: string
  lastReminderSentAt?: string
}

export interface Subscription {
  id: string
  clientId?: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientCompany?: string
  planName: string
  description?: string
  status: SubscriptionStatus
  amount: string
  numericAmount?: number
  billingCycle: BillingCycle
  customDaysCount?: number
  startDate?: string
  nextBillingDate: string
  lastRenewedDate?: string
  autoRenew?: boolean
  reminderDaysBefore?: number
  lastReminderSentAt?: string
  companyId?: string
  branchId?: string
  branchName?: string
  assignedMembers?: string[]
  assignedMemberEmails?: string[]
  billedBy?: string
  createdById?: string
  invoicesCount?: number
  createdProjectId?: string
}

export interface SubscriptionKPIs {
  totalMRR: number
  activeSubscriptionsCount: number
  upcomingInstallmentsDueCount: number
  upcomingInstallmentsDueAmount: number
  overdueInstallmentsCount: number
  overdueInstallmentsAmount: number
  totalCollectedThisMonth: number
}
