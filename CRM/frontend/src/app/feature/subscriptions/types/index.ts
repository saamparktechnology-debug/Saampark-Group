export type BillingCycle = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Half-Yearly" | "Annually" | "Custom Days"

export type SubscriptionStatus = "Active" | "Expiring Soon" | "Past Due" | "Canceled" | "Trial"

export type SubscriptionType = "package" | "regular" | "emi"

export type InstallmentStatus = "Paid" | "Pending" | "Overdue" | "Partially Paid"

export interface PackageTier {
  id: string
  name: string
  category: "Technology & Software" | "Digital Marketing" | "Cloud & Infrastructure" | "Creative & Branding" | "Custom"
  price: number
  billingCycle: BillingCycle
  description: string
  deliverables: string[]
  badge?: string
  popular?: boolean
  color?: string
}

export const PRESET_PACKAGE_TIERS: PackageTier[] = [
  {
    id: "pkg_startup",
    name: "Startup Digital Launch",
    category: "Digital Marketing",
    price: 15000,
    billingCycle: "Monthly",
    description: "Ideal for new businesses establishing online presence and automated lead generation.",
    deliverables: [
      "Custom 5-Page Responsive Web Presence",
      "SSL Certificate & Managed Cloud Hosting",
      "Google Search Console & Basic SEO Setup",
      "2 Social Media Marketing Campaigns/mo",
      "24/7 Server Health Monitoring",
      "Dedicated WhatsApp Support Desk",
    ],
    badge: "Starter",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "pkg_growth_erp",
    name: "Growth ERP & Maintenance Retainer",
    category: "Technology & Software",
    price: 35000,
    billingCycle: "Monthly",
    description: "Complete ERP software maintenance, bug fixes, database optimizations, and monthly feature rollouts.",
    deliverables: [
      "Full CRM / ERP Application Maintenance",
      "Automated Daily AWS Database Backups",
      "Up to 10 Service Request Tickets / Month",
      "Monthly Feature Enhancements (20 Dev Hrs)",
      "99.9% Uptime SLA Guarantee",
      "Bi-weekly Performance & Audit Reports",
    ],
    badge: "Most Popular",
    popular: true,
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: "pkg_fullstack_seo",
    name: "Full-Scale SEO & Digital Growth",
    category: "Digital Marketing",
    price: 25000,
    billingCycle: "Monthly",
    description: "Aggressive organic keyword rankings, high-converting Google Ads campaigns, and branded content.",
    deliverables: [
      "Targeted On-Page & Technical SEO Audits",
      "Google Ads PPC Campaign Optimization",
      "8 Branded Social Media Creatives / Month",
      "4 High-Intent Blog Posts / Articles",
      "Competitor Backlink Analysis & Outreach",
      "Live Analytics & Conversion Dashboard",
    ],
    badge: "High ROI",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "pkg_enterprise",
    name: "Enterprise Omnichannel Retainer",
    category: "Technology & Software",
    price: 75000,
    billingCycle: "Monthly",
    description: "Dedicated full-stack engineering squad, VIP priority support, and enterprise infrastructure management.",
    deliverables: [
      "Dedicated Full-Stack Developer & QA Lead",
      "Custom REST / GraphQL API Integrations",
      "Continuous CI/CD Pipeline & DevOps Support",
      "Security Audits & Vulnerability Patching",
      "Custom AI / Automation Workflows",
      "1-Hour Critical Incident Response SLA",
    ],
    badge: "Enterprise",
    color: "from-amber-500 to-orange-600",
  },
]

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
  firstPaymentDate?: string
  firstPaymentAmount?: number | string
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

  // 3 Subscription Models Support:
  subscriptionType?: SubscriptionType // "package" | "regular" | "emi"
  packageId?: string
  packageCategory?: string
  deliverables?: string[]
  totalTenureMonths?: number // For EMI Subscription (e.g. 3, 6, 12, 24)
  emiPerCycle?: number // Monthly / installment amount for EMI subscription
  downPayment?: number // Down payment if any
  paidInstallmentsCount?: number // Track progress of tenure
  totalInstallmentsCount?: number // Total installments in tenure

  // Non-GST / Tax Configuration
  isNonGst?: boolean
  taxType?: "gst" | "nongst"
  gstRate?: number

  // Overdue & Daily Late Fee / Added Payment Tracking
  dailyLateFee?: number // Daily added charge if overdue (e.g. ₹50/day)
  overdueDays?: number
  accumulatedLateFee?: number
  overduePaymentAdded?: number
}

export interface SubscriptionKPIs {
  totalMRR: number
  totalARR: number
  activeSubscriptionsCount: number
  packageSubscriptionsCount: number
  regularSubscriptionsCount: number
  emiSubscriptionsCount: number
  renewalsDueThisMonthCount: number
  renewalsDueThisMonthAmount: number
  totalCollectedThisMonth: number
  overdueCount?: number
  overdueAmount?: number
}

export interface EMIKPIs {
  totalContractValue: number
  totalPaid: number
  totalRemainingBalance: number
  activeContractsCount: number
  upcomingInstallmentsDueCount: number
  upcomingInstallmentsDueAmount: number
  overdueInstallmentsCount: number
  overdueInstallmentsAmount: number
  collectionRatePercent: number
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERDUE CALCULATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function calculateOverdueDays(dueDateStr?: string): number {
  if (!dueDateStr) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Parse date string (handles YYYY-MM-DD or DD/MM/YYYY)
  let due: Date
  if (dueDateStr.includes("/")) {
    const [d, m, y] = dueDateStr.split("/").map(Number)
    due = new Date(y, m - 1, d)
  } else {
    due = new Date(dueDateStr)
  }

  if (isNaN(due.getTime())) return 0
  due.setHours(0, 0, 0, 0)
  const diffTime = today.getTime() - due.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

export function calculateOverdueDetails(sub: Subscription): {
  isOverdue: boolean
  daysOverdue: number
  baseDue: number
  dailyLateFee: number
  accumulatedLateFee: number
  totalDueToday: number
} {
  const daysOverdue = calculateOverdueDays(sub.nextBillingDate)
  const isOverdue = daysOverdue > 0 && sub.status !== "Canceled"
  const baseDue = sub.numericAmount || parseInt(String(sub.amount).replace(/[^0-9]/g, "")) || 0
  const dailyLateFee = sub.dailyLateFee || 0
  const accumulatedLateFee = isOverdue ? daysOverdue * dailyLateFee : 0
  const totalDueToday = baseDue + accumulatedLateFee

  return {
    isOverdue,
    daysOverdue,
    baseDue,
    dailyLateFee,
    accumulatedLateFee,
    totalDueToday,
  }
}

