import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '@/services/apiServices'
import { api, setAuthToken } from '@/lib/api'
import { 
  fetchModuleDataFromDB, 
  saveModuleDataToDB, 
  markGlobalItemDeleted, 
  unmarkGlobalItemDeleted,
  syncGlobalDeletedIds, 
  isGlobalItemDeleted, 
  getLocalDeletedIds, 
  invalidateModuleCache 
} from '@/lib/storageSync'

export type Role = 'Super Admin' | 'Admin' | 'Clients' | 'Teams'
export type CompanyId = string

export interface Branch {
  id: string
  companyId: string
  company_id?: string | number
  name: string
  code?: string
  // 1. Brand & Division Names
  brand_name?: string
  division_name?: string
  subtitle?: string
  logo_url?: string
  // 2. Signature & Stamp Upload
  signatory_name?: string
  signatory_designation?: string
  signature_image_url?: string
  stamp_image_url?: string
  // 3. Legal & Tax IDs
  gstin?: string
  pan?: string
  cin?: string
  msme_reg?: string
  // 4. Address & Contacts
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  managerName?: string
  managerPhone?: string
  managerEmail?: string
  // 5. Bank & UPI Pay (Legacy / Fallback)
  upi_id?: string
  account_holder?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  bank_branch?: string
  payment_qr_url?: string
  bankDetails?: {
    accountHolder?: string
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    upiId?: string
  }
  // Dual GST & Non-GST Banking & QR Profiles
  gst_bank_name?: string
  gst_account_holder?: string
  gst_account_number?: string
  gst_ifsc_code?: string
  gst_bank_branch?: string
  gst_upi_id?: string
  gst_payment_qr_url?: string
  nongst_bank_name?: string
  nongst_account_holder?: string
  nongst_account_number?: string
  nongst_ifsc_code?: string
  nongst_bank_branch?: string
  nongst_upi_id?: string
  nongst_payment_qr_url?: string
  terms_conditions?: string
  invoice_notes?: string
  quotation_notes?: string
  signature_position?: { x: number; y: number }
  stamp_position?: { x: number; y: number }
  logo_position?: { x: number; y: number }
  logo_scale?: number
  stamp_scale?: number
  signature_scale?: number
  custom_stamps?: any[]
  zoom?: number
  preview_scale?: string
  preview_invoice_type?: string
  status: 'Active' | 'Inactive'
  createdAt?: string
}

export interface SubBranch {
  id: string
  parentBranchId: string
  companyId: string
  name: string
  code?: string
  partnerName?: string
  partnerPhone?: string
  partnerEmail?: string
  revenueSharePct: number // e.g. 30 -> 30% Partner share, 70% Company share
  partnerType?: "Franchise Partner" | "Agency Partner" | "Satellite Office" | "Regional Associate"
  // 1. Brand & Division Names
  brand_name?: string
  division_name?: string
  subtitle?: string
  logo_url?: string
  // 2. Signature & Stamp Upload
  signatory_name?: string
  signatory_designation?: string
  signature_image_url?: string
  stamp_image_url?: string
  // 3. Legal & Tax IDs
  gstin?: string
  pan?: string
  cin?: string
  msme_reg?: string
  // 4. Address & Contacts
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  // 5. Bank & UPI Pay
  upi_id?: string
  account_holder?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  bank_branch?: string
  payment_qr_url?: string
  bankDetails?: {
    accountHolder?: string
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    upiId?: string
  }
  gst_bank_name?: string
  gst_account_holder?: string
  gst_account_number?: string
  gst_ifsc_code?: string
  gst_bank_branch?: string
  gst_upi_id?: string
  gst_payment_qr_url?: string
  nongst_bank_name?: string
  nongst_account_holder?: string
  nongst_account_number?: string
  nongst_ifsc_code?: string
  nongst_bank_branch?: string
  nongst_upi_id?: string
  nongst_payment_qr_url?: string
  terms_conditions?: string
  invoice_notes?: string
  quotation_notes?: string
  iso_certification?: string
  signature_position?: { x: number; y: number }
  stamp_position?: { x: number; y: number }
  logo_position?: { x: number; y: number }
  logo_scale?: number
  stamp_scale?: number
  signature_scale?: number
  custom_stamps?: any[]
  zoom?: number
  preview_scale?: string
  preview_invoice_type?: string
  invoice_customization?: any
  status: 'Active' | 'Inactive'
  createdAt?: string
}

export interface Company {
  id: string
  numeric_id?: number
  name: string
  brand_name?: string
  division_name?: string
  subtitle?: string
  trademark_symbol?: string
  slug?: string
  logo?: string
  logo_url?: string
  currency?: string
  currency_symbol?: string
  // Legal & Registration IDs
  cin?: string
  gstin?: string
  pan?: string
  msme_reg?: string
  // Address & Contact Information
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  // Bank & Payment Gateway Details (Legacy / Fallback)
  upi_id?: string
  account_holder?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  bank_branch?: string
  swift_code?: string
  payment_qr_url?: string
  // Dual GST & Non-GST Banking & QR Profiles
  gst_bank_name?: string
  gst_account_holder?: string
  gst_account_number?: string
  gst_ifsc_code?: string
  gst_bank_branch?: string
  gst_upi_id?: string
  gst_payment_qr_url?: string
  nongst_bank_name?: string
  nongst_account_holder?: string
  nongst_account_number?: string
  nongst_ifsc_code?: string
  nongst_bank_branch?: string
  nongst_upi_id?: string
  nongst_payment_qr_url?: string
  terms_conditions?: string
  invoice_notes?: string
  quotation_notes?: string
  iso_certification?: string
  signatory_name?: string
  signatory_designation?: string
  signature_image_url?: string
  stamp_image_url?: string
  signature_position?: { x: number; y: number }
  stamp_position?: { x: number; y: number }
  logo_position?: { x: number; y: number }
  logo_scale?: number
  stamp_scale?: number
  signature_scale?: number
  custom_stamps?: any[]
  zoom?: number
  preview_scale?: string
  preview_invoice_type?: string
  invoice_customization?: any
  // SMTP / Email Dispatch Credentials (Per Company)
  smtp_host?: string
  smtp_port?: string | number
  smtp_user?: string
  smtp_pass?: string
  smtp_from_name?: string
  smtp_from_email?: string
  smtp_secure?: boolean
}

export interface User {
  id: string | number
  name: string
  email: string
  username?: string
  role: Role
  companyId: string
  companyIds?: string[] // Assigned companies list
  branchId?: string     // Assigned specific branch
  branchIds?: string[]    // Assigned multiple branches
  branchName?: string   // Human-readable branch name
  subBranchId?: string  // Assigned specific sub-branch
  subBranchIds?: string[] // Assigned multiple sub-branches
  subBranchName?: string // Human-readable sub-branch name
  sub_branch_id?: string
  sub_branch_name?: string
  avatar: string
  avatarUrl?: string
  phone?: string
  department?: string
  allowedModules?: string[]
  permissions?: any
  kycStatus?: "Pending" | "Processing" | "Verified" | "Rejected"
  kycData?: any
  status?: "Active" | "Inactive" | "Pending"
}

export function getCompanyLogoUrl(company?: Partial<Company> | null): string | null {
  if (!company) return null
  const candidates = [company.logo_url, (company as any)?.logoUrl, company.logo]
  for (const c of candidates) {
    if (typeof c === "string") {
      const trimmed = c.trim()
      if (
        trimmed.startsWith("http://") || 
        trimmed.startsWith("https://") || 
        trimmed.startsWith("data:image/") || 
        trimmed.startsWith("/") ||
        trimmed.includes(".png") ||
        trimmed.includes(".jpg") ||
        trimmed.includes(".jpeg") ||
        trimmed.includes(".svg") ||
        trimmed.includes(".webp")
      ) {
        return trimmed
      }
    }
  }
  return null
}

export function getCompanyFullName(company?: Partial<Company> | null): string {
  if (!company) return "SAAMPARK GROUP"
  
  // If company explicitly has a customized/full registered name, respect it
  const explicitName = (company.name || "").trim()
  if (explicitName && explicitName.toLowerCase() !== "saampark" && explicitName.toLowerCase() !== "saampark group") {
    return explicitName
  }

  const canon = getCanonicalCompanyId(company.slug || company.id || (company as any)?.numeric_id || company.name)
  const brand = (company.brand_name || "SAAMPARK").trim()
  
  if (canon === "tech" || canon === "1") {
    let div = (company.division_name || "").trim()
    if (!div || div.toLowerCase().includes("consult")) div = "TECHNOLOGY"
    const sub = (company.subtitle || "").trim()
    if (sub && !sub.toLowerCase().includes("consult")) {
      return `${brand} ${div} ${sub}`.trim()
    }
    return `${brand} ${div}`.trim()
  }

  if (canon === "consultancy" || canon === "2") {
    let div = (company.division_name || "").trim()
    if (!div || div.toLowerCase().includes("tech")) div = "CONSULTANCY SERVICE"
    const sub = (company.subtitle || "").trim()
    if (sub && !sub.toLowerCase().includes("tech")) {
      return `${brand} ${div} ${sub}`.trim()
    }
    return `${brand} ${div}`.trim()
  }

  const rawBrand = (company.brand_name || "").trim()
  const rawDivision = (company.division_name || "").trim()
  const rawSubtitle = (company.subtitle || "").trim()
  const rawName = (company.name || "").trim()

  if (rawName) return rawName
  if (rawBrand && rawDivision) {
    return rawSubtitle ? `${rawBrand} ${rawDivision} ${rawSubtitle}`.trim() : `${rawBrand} ${rawDivision}`.trim()
  }

  return rawBrand || "SAAMPARK GROUP"
}

export function getCanonicalCompanyId(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ""
  const str = String(val).toLowerCase().trim()
  if (!str) return ""
  if (str === "all") return "all"
  if (str === "digital" || str.includes("digital") || str.includes("marketing")) return "digital"
  if (str === "consultancy" || str.includes("consult")) return "consultancy"
  if (str === "1" || str === "tech" || str.includes("tech") || str.includes("research")) return "tech"
  if (str === "saampark-ai-solutions" || str.includes("ai-solutions") || str.includes("ai")) return "saampark-ai-solutions"
  return str
}

export function isMatchingCompany(
  comp: Partial<Company> | null | undefined, 
  targetIdOrSlug: string | number | null | undefined
): boolean {
  if (!comp || targetIdOrSlug === null || targetIdOrSlug === undefined) return false
  const target = String(targetIdOrSlug).toLowerCase().trim()
  if (!target) return false
  if (target === "all") return true

  const canonTarget = getCanonicalCompanyId(target)
  const canonComp = getCanonicalCompanyId(comp.id || comp.slug || (comp as any)?.numeric_id || comp.name || comp.division_name)

  if (canonTarget && canonComp) {
    return canonTarget === canonComp
  }

  const compIdStr = String(comp.id || "").toLowerCase().trim()
  const compSlugStr = String(comp.slug || "").toLowerCase().trim()
  return compIdStr === target || compSlugStr === target
}

export function isMatchingBranch(
  branch: Partial<Branch> | null | undefined,
  targetBranchId: string | number | null | undefined
): boolean {
  if (!branch || targetBranchId === null || targetBranchId === undefined) return false
  const target = String(targetBranchId).toLowerCase().trim()
  if (!target || target === "all") return true

  return (
    String(branch.id || "").toLowerCase().trim() === target ||
    String(branch.name || "").toLowerCase().trim() === target ||
    String(branch.code || "").toLowerCase().trim() === target
  )
}

export interface UserEntityScope {
  isSuperAdmin: boolean
  scopeLevel: 'global' | 'company' | 'branch' | 'subbranch'
  allowedCompanyIds: string[]
  allowedBranchIds: string[]
  allowedSubBranchIds: string[]
  canAccessCompanyHq: boolean
  canAccessBranchHq: boolean
}

export function getUserEntityScope(
  user: Partial<User> | null | undefined, 
  allCompanies: Company[] = [], 
  allBranches: Branch[] = [], 
  allSubBranches: SubBranch[] = []
): UserEntityScope {
  if (!user) {
    return {
      isSuperAdmin: false,
      scopeLevel: 'subbranch',
      allowedCompanyIds: [],
      allowedBranchIds: [],
      allowedSubBranchIds: [],
      canAccessCompanyHq: false,
      canAccessBranchHq: false,
    }
  }

  const isSuper = user.role === 'Super Admin' || (user as any).role_id === 1 || String((user as any).role_name || '').toLowerCase().includes('super') || user.email === 'hiisupriya@gmail.com' || user.email === 'saampark.official@gmail.com'
  if (isSuper) {
    return {
      isSuperAdmin: true,
      scopeLevel: 'global',
      allowedCompanyIds: allCompanies.map(c => String(c.id)),
      allowedBranchIds: allBranches.map(b => String(b.id)),
      allowedSubBranchIds: allSubBranches.map(sb => String(sb.id)),
      canAccessCompanyHq: true,
      canAccessBranchHq: true,
    }
  }

  // 1. Check Sub-Branch Level Scope
  const rawSubBranchIds: string[] = []
  if (Array.isArray((user as any).subBranchIds)) {
    rawSubBranchIds.push(...(user as any).subBranchIds)
  }
  const singleSub = (user as any).subBranchId || (user as any).sub_branch_id
  if (singleSub && !rawSubBranchIds.includes(singleSub)) {
    rawSubBranchIds.push(singleSub)
  }

  if (rawSubBranchIds.length > 0) {
    const matchedSubs = allSubBranches.filter(sb => 
      rawSubBranchIds.some(id => String(id).toLowerCase().trim() === String(sb.id).toLowerCase().trim())
    )
    const allowedSubIds = matchedSubs.length > 0 ? matchedSubs.map(s => String(s.id)) : rawSubBranchIds

    // Find parent branches
    const parentBranchIds = Array.from(new Set(matchedSubs.map(s => String(s.parentBranchId)).filter(Boolean)))
    // Find parent companies
    const parentBranches = allBranches.filter(b => parentBranchIds.includes(String(b.id)))
    const parentCompanyIds = Array.from(new Set([
      ...parentBranches.map(b => String(b.companyId || (b as any).company_id)),
      String(user.companyId || '')
    ].filter(Boolean)))

    return {
      isSuperAdmin: false,
      scopeLevel: 'subbranch',
      allowedCompanyIds: parentCompanyIds,
      allowedBranchIds: parentBranchIds,
      allowedSubBranchIds: allowedSubIds,
      canAccessCompanyHq: false,
      canAccessBranchHq: false,
    }
  }

  // 2. Check Branch Level Scope
  const rawBranchIds: string[] = []
  if (Array.isArray(user.branchIds)) {
    rawBranchIds.push(...user.branchIds)
  }
  const singleBranch = user.branchId || (user as any).branch_id
  if (singleBranch && !rawBranchIds.includes(singleBranch)) {
    rawBranchIds.push(singleBranch)
  }

  if (rawBranchIds.length > 0) {
    const matchedBranches = allBranches.filter(b =>
      rawBranchIds.some(id => String(id).toLowerCase().trim() === String(b.id).toLowerCase().trim())
    )
    const allowedBIds = matchedBranches.length > 0 ? matchedBranches.map(b => String(b.id)) : rawBranchIds

    // Find parent companies
    const parentCompanyIds = Array.from(new Set([
      ...matchedBranches.map(b => String(b.companyId || (b as any).company_id)),
      String(user.companyId || '')
    ].filter(Boolean)))

    // Find all sub-branches under these allowed branches
    const allowedSubIds = allSubBranches
      .filter(sb => allowedBIds.includes(String(sb.parentBranchId)))
      .map(sb => String(sb.id))

    return {
      isSuperAdmin: false,
      scopeLevel: 'branch',
      allowedCompanyIds: parentCompanyIds,
      allowedBranchIds: allowedBIds,
      allowedSubBranchIds: allowedSubIds,
      canAccessCompanyHq: false,
      canAccessBranchHq: true,
    }
  }

  // 3. Company Level Scope (Default for users assigned to Company, e.g. Company Admin or Staff)
  const rawCompanyIds: string[] = []
  if (Array.isArray(user.companyIds)) {
    rawCompanyIds.push(...user.companyIds)
  }
  const singleComp = user.companyId || (user as any).company_id || (user as any).company
  if (singleComp && !rawCompanyIds.includes(singleComp)) {
    rawCompanyIds.push(String(singleComp))
  }
  if (rawCompanyIds.length === 0 && (user as any).companyName) {
    const matchedByName = allCompanies.find(c => 
      c.name.toLowerCase().trim() === String((user as any).companyName).toLowerCase().trim() ||
      (c.brand_name && c.brand_name.toLowerCase().trim() === String((user as any).companyName).toLowerCase().trim())
    )
    if (matchedByName) {
      rawCompanyIds.push(String(matchedByName.id))
    }
  }
  if (rawCompanyIds.length === 0) {
    rawCompanyIds.push('tech')
  }

  const matchedCompanies = allCompanies.filter(c => 
    rawCompanyIds.some(id => isMatchingCompany(c, id))
  )
  const allowedCIds = matchedCompanies.length > 0 ? matchedCompanies.map(c => String(c.id)) : rawCompanyIds

  // Branches belonging to these companies
  const allowedBIds = allBranches
    .filter(b => allowedCIds.some(cId => isMatchingCompany({ id: cId } as any, b.companyId || (b as any).company_id)))
    .map(b => String(b.id))

  // Sub-branches belonging to those branches
  const allowedSubIds = allSubBranches
    .filter(sb => allowedBIds.includes(String(sb.parentBranchId)))
    .map(sb => String(sb.id))

  return {
    isSuperAdmin: false,
    scopeLevel: 'company',
    allowedCompanyIds: allowedCIds,
    allowedBranchIds: allowedBIds,
    allowedSubBranchIds: allowedSubIds,
    canAccessCompanyHq: true,
    canAccessBranchHq: true,
  }
}

/**
 * Resolves the allowed company list for form selectors / dropdowns.
 * If activeCompanyId is a specific company (not 'all' and not empty),
 * returns ONLY that active company so users cannot choose a different company.
 * Full company selection across all companies is ONLY allowed when activeCompanyId === 'all'.
 */
export function getSelectableCompanies(
  allCompanies: Company[] = [],
  activeCompanyId?: string | null,
  user?: Partial<User> | null,
  allBranches: Branch[] = [],
  allSubBranches: SubBranch[] = []
): Company[] {
  // 1. If an active company is explicitly selected (and NOT "all"):
  if (activeCompanyId && activeCompanyId !== "all") {
    const matched = allCompanies.filter(c => isMatchingCompany(c, activeCompanyId))
    if (matched.length > 0) return matched
    // Fallback if not loaded yet
    return allCompanies.slice(0, 1)
  }

  // 2. If user is restricted to specific company(ies) (non-super-admin):
  if (user && user.role !== "Super Admin" && !(user as any).isMaster) {
    const userScope = getUserEntityScope(user, allCompanies, allBranches, allSubBranches)
    if (userScope && userScope.allowedCompanyIds && userScope.allowedCompanyIds.length > 0) {
      const userMatched = allCompanies.filter(c => userScope.allowedCompanyIds.some(id => isMatchingCompany(c, id)))
      if (userMatched.length > 0) return userMatched
    }
  }

  // 3. Global scope ("all" / All Companies): return all companies
  return allCompanies
}

export const DEFAULT_COMPANIES: Company[] = [
  { 
    id: 'tech', 
    numeric_id: 1,
    brand_name: 'SAAMPARK',
    division_name: 'TECHNOLOGY',
    name: 'SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED', 
    subtitle: 'AND RESEARCH PRIVATE LIMITED',
    logo: '💻', 
    logo_url: '/saampark-logo.png',
    slug: 'tech', 
    currency: 'INR',
    currency_symbol: '₹',
    cin: '',
    gstin: '',
    pan: '',
    address: 'Madinipur, Kolkata, Durgapur, West Bengal, India - 721101',
    phone: '+91 9901518567 / +91 9901518569',
    email: 'info@saamparktechnology.com',
    website: 'www.saamparktechnology.com',
    upi_id: '',
    gst_upi_id: '',
    nongst_upi_id: '',
    account_holder: '',
    gst_account_holder: '',
    nongst_account_holder: '',
    bank_name: '',
    gst_bank_name: '',
    nongst_bank_name: '',
    account_number: '',
    gst_account_number: '',
    nongst_account_number: '',
    ifsc_code: '',
    gst_ifsc_code: '',
    nongst_ifsc_code: '',
    bank_branch: '',
    gst_bank_branch: '',
    nongst_bank_branch: '',
    terms_conditions: '1. E.& O.E.\n2. Total payment due to be paid within due date to avoid suspension/cancellation.\n3. Please include the invoice number in your payment notes.\n4. All disputes are subject to Paschim Medinipur jurisdiction only.\n5. For payment & refund related queries, read our Refund & Return Policy on website.',
    signatory_name: 'Authorized Signatory',
    signatory_designation: 'Managing Director'
  },
  { 
    id: 'consultancy', 
    numeric_id: 2,
    brand_name: 'SAAMPARK',
    division_name: 'CONSULTANCY SERVICE',
    name: 'SAAMPARK CONSULTANCY SERVICE', 
    subtitle: 'MANAGEMENT & ADVISORY SERVICES',
    logo: '💼', 
    logo_url: '', 
    slug: 'consultancy', 
    currency: 'INR',
    currency_symbol: '₹',
    cin: '',
    gstin: '',
    pan: '',
    address: '',
    phone: '+91 9901518570',
    email: 'consultancy@saampark.in',
    website: 'www.saampark.in',
    upi_id: '',
    gst_upi_id: '',
    nongst_upi_id: '',
    account_holder: '',
    gst_account_holder: '',
    nongst_account_holder: '',
    bank_name: '',
    gst_bank_name: '',
    nongst_bank_name: '',
    account_number: '',
    gst_account_number: '',
    nongst_account_number: '',
    ifsc_code: '',
    gst_ifsc_code: '',
    nongst_ifsc_code: '',
    bank_branch: '',
    gst_bank_branch: '',
    nongst_bank_branch: '',
    terms_conditions: '1. All consulting engagements are initiated following signed scope of work.\n2. Retainer fees are payable in advance.\n3. All disputes are subject to Kolkata jurisdiction only.',
    signatory_name: 'Authorized Signatory',
    signatory_designation: 'Consulting Director'
  },
]

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'br-1',
    companyId: 'tech',
    name: 'Head Office - Mumbai & Kolkata Technology Center',
    code: 'STR-HO',
    city: 'Mumbai / Kolkata',
    state: 'Maharashtra / West Bengal',
    country: 'India',
    phone: '+91 9901518567',
    email: 'ho@saamparktechnology.com',
    managerName: 'Supriya Kumar',
    status: 'Active',
  },
]

export const COMPANIES = DEFAULT_COMPANIES


export const DEMO_USERS: Record<Role, User | null> = {
  'Super Admin': null,
  'Admin': null,
  'Teams': null,
  'Clients': null,
}

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: User | null
  activeCompanyId: string | null
  activeBranchId: string | null
  activeSubBranchId: string | null
  companies: Company[]
  branches: Branch[]
  subBranches: SubBranch[]
  
  // Actions
  loginAs: (role: Role | string, customUser?: Partial<User>) => void
  loginWithCredentials: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchCompany: (companyId: string) => void
  switchBranch: (branchId: string | null) => void
  switchSubBranch: (subBranchId: string | null) => void
  fetchCompanies: () => Promise<Company[]>
  fetchBranches: () => Promise<Branch[]>
  fetchSubBranches: () => Promise<SubBranch[]>
  addCompany: (company: Partial<Company>) => Promise<Company | null>
  updateCompany: (companyId: string, updates: Partial<Company>) => Promise<Company | null>
  deleteCompany: (companyId: string) => Promise<boolean>
  addBranch: (branch: Partial<Branch>) => Promise<Branch | null>
  updateBranch: (branchId: string, updates: Partial<Branch>) => Promise<void>
  deleteBranch: (branchId: string) => Promise<boolean>
  addSubBranch: (subBranch: Partial<SubBranch>) => Promise<SubBranch | null>
  updateSubBranch: (subBranchId: string, updates: Partial<SubBranch>) => Promise<void>
  deleteSubBranch: (subBranchId: string) => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      activeCompanyId: null,
      activeBranchId: null,
      activeSubBranchId: null,
      companies: DEFAULT_COMPANIES,
      branches: DEFAULT_BRANCHES,
      subBranches: [],

      fetchCompanies: async () => {
        try {
          const deletedIds = await syncGlobalDeletedIds().catch(() => getLocalDeletedIds())

          // 1. Fetch companies from MySQL module data store (primary single source of truth)
          const dbCompanies = await fetchModuleDataFromDB<Company[]>('companies', [], 'all').catch(() => [])

          // 2. Fetch from backend API (companies table directly) — include ALL fields
          let apiList: Company[] = []
          const res: any = await api.get('/companies').catch(() => null)
          if (res && (Array.isArray(res.data) || Array.isArray(res))) {
            const list = Array.isArray(res.data) ? res.data : res
            apiList = list.map((c: any) => ({
              // Pass through ALL MySQL fields
              ...c,
              // Normalize identifiers
              id: c.slug || String(c.id),
              numeric_id: c.id,
              slug: c.slug || String(c.id),
              // Computed fields with safe fallbacks
              brand_name: c.brand_name !== undefined ? c.brand_name : (c.name?.startsWith('SAAMPARK') ? 'SAAMPARK' : c.name),
              division_name: c.division_name !== undefined ? c.division_name : '',
              subtitle: c.subtitle !== undefined ? c.subtitle : '',
              logo: c.logo || (c.slug === 'digital' ? '📈' : (c.slug === 'saampark-ai-solutions' ? '🤖' : '💻')),
              currency: c.currency || 'INR',
              currency_symbol: c.currency_symbol || '₹',
              industry: c.industry || 'Technology',
            }))
          }


          const map = new Map<string, Company>()

          const getCanonicalKey = (c: Partial<Company>) => {
            const canon = getCanonicalCompanyId(c.slug || c.id || (c as any)?.numeric_id || c.name)
            if (canon === 'consultancy' || canon.includes('consult')) return 'consultancy'
            if (canon === 'tech' || canon === '1' || canon.includes('tech') || canon.includes('research')) return 'tech'
            return String(c.id || c.slug || 'tech').toLowerCase().trim()
          }

          // 1. First add DEFAULT_COMPANIES as baseline
          DEFAULT_COMPANIES.forEach(c => {
            const key = getCanonicalKey(c)
            map.set(key, {
              ...c,
              id: key,
              slug: key,
              name: getCompanyFullName(c),
            })
          })

          // 2. Overlay currently cached store companies (preserves custom local fields)
          const currentStoreCompanies = get().companies || []
          currentStoreCompanies.forEach(c => {
            const key = getCanonicalKey(c)
            const existing = map.get(key)
            map.set(key, {
              ...existing,
              ...c,
              id: key,
              slug: key,
              brand_name: c.brand_name || existing?.brand_name || 'SAAMPARK',
              division_name: c.division_name !== undefined ? c.division_name : (existing?.division_name || ''),
              subtitle: c.subtitle !== undefined ? c.subtitle : (existing?.subtitle || ''),
              name: getCompanyFullName({ ...existing, ...c }),
            })
          })

          // 3. Overlay DB module store (app_data table)
          if (Array.isArray(dbCompanies) && dbCompanies.length > 0) {
            dbCompanies.forEach(c => {
              const key = getCanonicalKey(c)
              const existing = map.get(key)
              map.set(key, {
                ...existing,
                ...c,
                id: key,
                slug: key,
                logo_url: (c.logo_url && c.logo_url.trim() !== '') ? c.logo_url : (existing?.logo_url || ''),
                brand_name: c.brand_name || existing?.brand_name || 'SAAMPARK',
                division_name: c.division_name !== undefined ? c.division_name : (existing?.division_name || ''),
                subtitle: c.subtitle !== undefined ? c.subtitle : (existing?.subtitle || ''),
                name: getCompanyFullName({ ...existing, ...c }),
              })
            })
          }

          // 4. Overlay Live Backend API (MySQL companies table)
          apiList.forEach(c => {
            const key = getCanonicalKey(c)
            const existing = map.get(key)
            map.set(key, {
              ...existing,
              ...c,
              id: key,
              slug: key,
              logo_url: (c.logo_url && c.logo_url.trim() !== '') ? c.logo_url : (existing?.logo_url || ''),
              brand_name: existing?.brand_name || c.brand_name || c.name,
              division_name: existing?.division_name !== undefined ? existing.division_name : (c.division_name || ''),
              subtitle: existing?.subtitle !== undefined ? existing.subtitle : (c.subtitle || ''),
              name: getCompanyFullName({ ...existing, ...c }),
            })
          })

          const rawTech = map.get('tech') || DEFAULT_COMPANIES[0]
          const rawConsult = map.get('consultancy') || DEFAULT_COMPANIES[1]

          // Build sanitized companies: use rawTech/rawConsult as primary source.
          // Only fall back to DEFAULT_COMPANIES for fields that are truly missing (undefined),
          // NOT for fields that are empty string (user intentionally cleared them).
          const sanitizedTech: Company = {
            ...rawTech,
            id: 'tech',
            slug: 'tech',
            numeric_id: (rawTech as any).numeric_id || 1,
            brand_name: rawTech.brand_name !== undefined ? rawTech.brand_name : 'SAAMPARK',
            division_name: rawTech.division_name !== undefined ? rawTech.division_name : 'TECHNOLOGY',
            subtitle: rawTech.subtitle !== undefined ? rawTech.subtitle : 'AND RESEARCH PRIVATE LIMITED',
            name: (rawTech.name && rawTech.name.trim() !== '') ? rawTech.name : 'SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED',
            logo: rawTech.logo || '💻',
            logo_url: rawTech.logo_url !== undefined ? rawTech.logo_url : '/saampark-logo.png',
            signature_position: rawTech.signature_position || { x: 0, y: 0 },
            stamp_position: rawTech.stamp_position || { x: 0, y: 0 },
            logo_scale: rawTech.logo_scale ?? 1,
            stamp_scale: rawTech.stamp_scale ?? 1,
            signature_scale: rawTech.signature_scale ?? 1,
            custom_stamps: Array.isArray(rawTech.custom_stamps) ? rawTech.custom_stamps : [],
            invoice_customization: rawTech.invoice_customization || { hidden_fields: [] },
          }

          const sanitizedConsult: Company = {
            ...rawConsult,
            id: 'consultancy',
            slug: 'consultancy',
            numeric_id: (rawConsult as any).numeric_id || 2,
            brand_name: rawConsult.brand_name !== undefined ? rawConsult.brand_name : 'SAAMPARK',
            division_name: rawConsult.division_name !== undefined ? rawConsult.division_name : 'CONSULTANCY SERVICE',
            subtitle: rawConsult.subtitle !== undefined ? rawConsult.subtitle : 'MANAGEMENT & ADVISORY SERVICES',
            name: (rawConsult.name && rawConsult.name.trim() !== '') ? rawConsult.name : 'SAAMPARK CONSULTANCY SERVICE',
            logo: rawConsult.logo || '💼',
            logo_url: (rawConsult.logo_url && rawConsult.logo_url !== '/saampark-logo.png') ? rawConsult.logo_url : '',
            signature_position: rawConsult.signature_position || { x: 0, y: 0 },
            stamp_position: rawConsult.stamp_position || { x: 0, y: 0 },
            logo_scale: rawConsult.logo_scale ?? 1,
            stamp_scale: rawConsult.stamp_scale ?? 1,
            signature_scale: rawConsult.signature_scale ?? 1,
            custom_stamps: Array.isArray(rawConsult.custom_stamps) ? rawConsult.custom_stamps : [],
            invoice_customization: rawConsult.invoice_customization || { hidden_fields: [] },
          }

          const combined: Company[] = [sanitizedTech, sanitizedConsult]
          map.forEach((comp, key) => {
            if (key !== 'tech' && key !== 'consultancy') {
              combined.push({
                ...comp,
                id: comp.id || key,
                slug: comp.slug || key,
                name: (comp.name && comp.name.trim() !== '') ? comp.name : getCompanyFullName(comp),
              })
            }
          })

          set({ companies: combined })
          return combined
        } catch (err) {
          console.warn("fetchCompanies warning:", err)
        }

        const currentFiltered = DEFAULT_COMPANIES
        set({ companies: currentFiltered })
        return currentFiltered
      },

      fetchBranches: async () => {
        try {
          const deletedIds = await syncGlobalDeletedIds().catch(() => getLocalDeletedIds())
          const isBranchDeleted = (id?: string | number, code?: string) => {
            if (id && isGlobalItemDeleted(id, deletedIds, 'branches')) return true
            if (code && isGlobalItemDeleted(code, deletedIds, 'branches')) return true
            return false
          }

          // Fetch from both sources in parallel
          const [dbBranches, apiRes] = await Promise.all([
            fetchModuleDataFromDB<Branch[]>('branches', [], 'all').catch(() => null),
            api.get('/branches', { headers: { 'x-company-id': 'all' } }).catch(() => null),
          ])

          const branchMap = new Map<string, Branch>()

          // 1. Load app_data branches first
          if (Array.isArray(dbBranches) && dbBranches.length > 0) {
            dbBranches.forEach(b => {
              if (!isBranchDeleted(b.id, b.code)) {
                branchMap.set(String(b.id), { ...b })
              }
            })
          }

          // 2. Overlay MySQL API branches (higher priority — this is the real DB)
          const apiList = apiRes && (Array.isArray(apiRes.data) || Array.isArray(apiRes))
            ? (Array.isArray(apiRes.data) ? apiRes.data : apiRes)
            : []
          apiList.forEach((b: Branch) => {
            if (!isBranchDeleted(b.id, b.code)) {
              const strKey = String(b.id)
              const existing = branchMap.get(strKey)
              branchMap.set(strKey, { ...(existing || {}), ...b })
            }
          })

          // 3. If both sources are empty, fall back to DEFAULT_BRANCHES as last resort only
          if (branchMap.size === 0) {
            DEFAULT_BRANCHES.forEach(b => {
              if (!isBranchDeleted(b.id, b.code)) {
                branchMap.set(String(b.id), { ...b })
              }
            })
          }

          const currentCompanies = get().companies || DEFAULT_COMPANIES
          const filtered = Array.from(branchMap.values()).map(b => {
            const rawComp = b.companyId || (b as any).company_id
            const matchedComp = currentCompanies.find(c => isMatchingCompany(c, rawComp))
            const compSlug = matchedComp?.slug || matchedComp?.id || (b as any).company_slug || String(rawComp || 'tech')
            const numericId = matchedComp?.numeric_id || (compSlug === 'tech' ? 1 : compSlug === 'digital' ? 2 : compSlug === 'saampark-ai-solutions' ? 3 : Number((b as any).company_id) || 1)
            return {
              ...b,
              companyId: b.companyId || compSlug,
              company_id: (b as any).company_id || numericId,
              code: b.code ? b.code.toUpperCase() : b.code,
            }
          })

          set({ branches: filtered })
          return filtered
        } catch (err) {
          console.warn("fetchBranches warning:", err)
        }
        const localDeleted = getLocalDeletedIds()
        const isBranchDeletedFallback = (id?: string | number, code?: string) => {
          if (id && isGlobalItemDeleted(id, localDeleted, 'branches')) return true
          if (code && isGlobalItemDeleted(code, localDeleted, 'branches')) return true
          return false
        }
        const currentFiltered = get().branches
          .filter(b => !isBranchDeletedFallback(b.id, b.code))
        set({ branches: currentFiltered })
        return currentFiltered
      },

      fetchSubBranches: async () => {
        try {
          const deletedIds = await syncGlobalDeletedIds().catch(() => getLocalDeletedIds())
          const isSubBranchDeleted = (id?: string | number, code?: string) => {
            if (id && isGlobalItemDeleted(id, deletedIds, 'sub_branches')) return true
            if (code && isGlobalItemDeleted(code, deletedIds, 'sub_branches')) return true
            return false
          }

          const dbSubBranches = await fetchModuleDataFromDB<SubBranch[]>('sub_branches', [], 'all').catch(() => null)
          
          let list: SubBranch[] = []
          if (Array.isArray(dbSubBranches) && dbSubBranches.length > 0) {
            list = dbSubBranches
          } else {
            const res: any = await api.get('/branches/sub-branches/all', { headers: { 'x-company-id': 'all' } }).catch(() => null)
            if (res && (Array.isArray(res.data) || Array.isArray(res))) {
              list = Array.isArray(res.data) ? res.data : res
            }
          }

          const filtered = list.filter(sb => !isSubBranchDeleted(sb.id, sb.code))
          set({ subBranches: filtered })
          return filtered
        } catch (err) {
          console.warn("fetchSubBranches warning:", err)
        }
        const localDeleted = getLocalDeletedIds()
        const currentFiltered = (get().subBranches || []).filter(sb => !isGlobalItemDeleted(sb.id, localDeleted, 'sub_branches'))
        set({ subBranches: currentFiltered })
        return currentFiltered
      },

      addCompany: async (newComp: Partial<Company>) => {
        const { user, companies } = get()
        if (user?.role !== 'Super Admin') {
          throw new Error('Only Super Admin can create companies.')
        }

        try {
          const compSlug = newComp.slug || newComp.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `comp_${Date.now()}`
          unmarkGlobalItemDeleted(compSlug)
          unmarkGlobalItemDeleted(newComp.name || '')

          await api.post('/companies', {
            name: newComp.name,
            slug: compSlug,
            currency: newComp.currency || 'INR',
            currency_symbol: newComp.currency_symbol || '₹',
            logo_url: newComp.logo_url,
          }).catch((err) => {
            console.warn('Create company API warning:', err)
          })

          const created: Company = {
            id: compSlug,
            name: getCompanyFullName(newComp),
            brand_name: newComp.brand_name || 'SAAMPARK',
            division_name: newComp.division_name || '',
            subtitle: newComp.subtitle || '',
            slug: compSlug,
            logo: newComp.logo || '🏢',
            logo_url: newComp.logo_url || '',
            currency: newComp.currency || 'INR',
            currency_symbol: newComp.currency_symbol || '₹',
            cin: newComp.cin || '',
            gstin: newComp.gstin || '',
            pan: newComp.pan || '',
            address: newComp.address || '',
            city: newComp.city || '',
            state: newComp.state || '',
            zip: newComp.zip || '',
            country: newComp.country || 'India',
            phone: newComp.phone || '',
            email: newComp.email || '',
            website: newComp.website || '',
            upi_id: newComp.upi_id || '',
            account_holder: newComp.account_holder || '',
            bank_name: newComp.bank_name || '',
            account_number: newComp.account_number || '',
            ifsc_code: newComp.ifsc_code || '',
            bank_branch: newComp.bank_branch || '',
            swift_code: newComp.swift_code || '',
            payment_qr_url: newComp.payment_qr_url || '',
            terms_conditions: newComp.terms_conditions || '',
            invoice_notes: newComp.invoice_notes || '',
            quotation_notes: newComp.quotation_notes || '',
            signatory_name: newComp.signatory_name || '',
            signatory_designation: newComp.signatory_designation || '',
            signature_image_url: newComp.signature_image_url || '',
            stamp_image_url: newComp.stamp_image_url || '',
          }

          unmarkGlobalItemDeleted(created.id)

          const current = get().companies
          const updated = [...current.filter(c => c.id !== created.id && c.slug !== created.slug), created]
          
          // Ensure Super Admin and creator has the newly created company in their companyIds and immediately activate it
          const currentUser = get().user
          let updatedUser = currentUser
          if (currentUser) {
            const currentCompIds = currentUser.companyIds || (currentUser.companyId ? [currentUser.companyId] : ['tech'])
            const newCompIds = Array.from(new Set([...currentCompIds, created.id, created.slug].filter(Boolean))) as string[]
            updatedUser = {
              ...currentUser,
              companyId: created.id as any,
              companyIds: newCompIds,
            }
          }

          set({ 
            companies: updated,
            activeCompanyId: created.id,
            activeBranchId: null,
            activeSubBranchId: null,
            user: updatedUser,
          })

          invalidateModuleCache('companies')

          // Persist to MySQL database single source of truth
          await saveModuleDataToDB('companies', updated, 'all').catch(() => {})
          if (updatedUser) {
            import('@/app/feature/users/services/userService').then(({ recordUserAccount }) => {
              recordUserAccount({
                ...updatedUser,
                id: String(updatedUser.id),
              })
            }).catch(() => {})
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'))
            window.dispatchEvent(new CustomEvent('saampark_data_synced'))
            window.dispatchEvent(new CustomEvent('saampark_company_switched', { detail: { companyId: created.id } }))
            window.dispatchEvent(new CustomEvent('saampark_company_updated', { detail: created }))
          }

          return created
        } catch (err) {
          console.error("addCompany error:", err)
          return null
        }
      },

      updateCompany: async (companyId: string, updates: Partial<Company>) => {
        const { user, companies } = get()
        const isSuperAdmin = user?.role === 'Super Admin' || (user as any)?.role_id === 1 || String((user as any)?.role_name || '').toLowerCase().includes('super') || user?.email === 'hiisupriya@gmail.com' || user?.email === 'saampark.official@gmail.com'
        const isAdmin = user?.role === 'Admin' || (user as any)?.role_id === 2 || String((user as any)?.role_name || '').toLowerCase().includes('admin')

        if (!isSuperAdmin && !isAdmin) {
          throw new Error('Access denied: You do not have permission to modify company details.')
        }

        const compIndex = companies.findIndex(c => 
          String(c.id).toLowerCase() === String(companyId).toLowerCase() || 
          String(c.slug || '').toLowerCase() === String(companyId).toLowerCase() ||
          String((c as any).numeric_id || '').toLowerCase() === String(companyId).toLowerCase() ||
          isMatchingCompany(c, companyId)
        )
        if (compIndex === -1) return null

        const target = companies[compIndex]

        if (!isSuperAdmin && isAdmin) {
          const userAssignedComps = [
            ...(Array.isArray((user as any)?.companyIds) ? (user as any).companyIds : []),
            (user as any)?.companyId,
            (user as any)?.company_id,
          ].filter(Boolean).map((id: any) => String(id).toLowerCase().trim())

          const isAssigned = userAssignedComps.some(assignedId => isMatchingCompany(target, assignedId))
          if (!isAssigned) {
            throw new Error('Access denied: You can only modify your assigned company.')
          }
        }
        const merged: Company = {
          ...target,
          ...updates,
          id: updates.slug || target.id,
          slug: updates.slug || target.slug,
          brand_name: updates.brand_name !== undefined ? updates.brand_name : (target.brand_name || 'SAAMPARK'),
          division_name: updates.division_name !== undefined ? updates.division_name : (target.division_name || ''),
          subtitle: updates.subtitle !== undefined ? updates.subtitle : (target.subtitle || ''),
          trademark_symbol: updates.trademark_symbol !== undefined ? updates.trademark_symbol : (target.trademark_symbol || ''),
          logo_url: updates.logo_url !== undefined ? updates.logo_url : (target.logo_url || ''),
          name: updates.name || getCompanyFullName({ ...target, ...updates }),
        }

        // Persist ALL fields to backend API
        try {
          const apiTargetId = (target as any).numeric_id || target.id
          await api.put(`/companies/${apiTargetId}`, {
            ...merged,
            name: merged.name,
            slug: merged.slug || merged.id,
            trademark_symbol: merged.trademark_symbol ?? '',
            currency: merged.currency,
            currency_symbol: merged.currency_symbol,
            logo_url: merged.logo_url,
            address: merged.address ?? '',
            phone: merged.phone ?? '',
            email: merged.email ?? '',
            website: merged.website ?? '',
            gstin: merged.gstin ?? '',
            pan: merged.pan ?? '',
            cin: merged.cin ?? '',
            msme_reg: merged.msme_reg ?? '',
            iso_certification: merged.iso_certification ?? '',
            brand_name: merged.brand_name ?? '',
            division_name: merged.division_name ?? '',
            subtitle: merged.subtitle ?? '',
            signatory_name: merged.signatory_name ?? '',
            signatory_designation: merged.signatory_designation ?? '',
            signature_image_url: merged.signature_image_url ?? '',
            stamp_image_url: merged.stamp_image_url ?? '',
            terms_conditions: merged.terms_conditions ?? '',
            invoice_notes: merged.invoice_notes ?? '',
            upi_id: merged.upi_id ?? '',
            account_holder: merged.account_holder ?? '',
            bank_name: merged.bank_name ?? '',
            account_number: merged.account_number ?? '',
            ifsc_code: merged.ifsc_code ?? '',
            bank_branch: merged.bank_branch ?? '',
            payment_qr_url: merged.payment_qr_url ?? '',
            gst_bank_name: merged.gst_bank_name ?? '',
            gst_account_holder: merged.gst_account_holder ?? '',
            gst_account_number: merged.gst_account_number ?? '',
            gst_ifsc_code: merged.gst_ifsc_code ?? '',
            gst_bank_branch: merged.gst_bank_branch ?? '',
            gst_upi_id: merged.gst_upi_id ?? '',
            gst_payment_qr_url: merged.gst_payment_qr_url ?? '',
            nongst_bank_name: merged.nongst_bank_name ?? '',
            nongst_account_holder: merged.nongst_account_holder ?? '',
            nongst_account_number: merged.nongst_account_number ?? '',
            nongst_ifsc_code: merged.nongst_ifsc_code ?? '',
            nongst_bank_branch: merged.nongst_bank_branch ?? '',
            nongst_upi_id: merged.nongst_upi_id ?? '',
            nongst_payment_qr_url: merged.nongst_payment_qr_url ?? '',
            signature_position: merged.signature_position,
            stamp_position: merged.stamp_position,
            logo_scale: merged.logo_scale,
            stamp_scale: merged.stamp_scale,
            signature_scale: merged.signature_scale,
            custom_stamps: merged.custom_stamps,
            zoom: merged.zoom,
            preview_invoice_type: merged.preview_invoice_type,
            invoice_customization: merged.invoice_customization,
          }).catch(() => {})
        } catch {}

        const updated = [...companies]
        updated[compIndex] = merged
        set({ companies: updated })

        invalidateModuleCache('companies')

        // Persist to MySQL module data store
        await saveModuleDataToDB('companies', updated, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
          window.dispatchEvent(new CustomEvent('saampark_company_updated', { detail: merged }))
          window.dispatchEvent(new CustomEvent('saampark_company_switched', { detail: { companyId: merged.id } }))
        }

        return merged
      },

      deleteCompany: async (companyId: string) => {
        const { user, companies, branches, activeCompanyId } = get()
        const isSuperAdmin = user?.role === 'Super Admin' || String(user?.role || '').toLowerCase().includes('super') || (user as any)?.role_id === 1
        if (!isSuperAdmin) {
          throw new Error('Only Super Admin can delete companies.')
        }

        const compToDelete = companies.find(c => isMatchingCompany(c, companyId))
        const targetId = compToDelete?.id || companyId
        const targetSlug = compToDelete?.slug || companyId
        const targetNumericId = (compToDelete as any)?.numeric_id ? String((compToDelete as any).numeric_id) : ''

        // Mark deleted in universal tombstone registry with module 'companies'
        await markGlobalItemDeleted(targetId, 'companies')
        if (targetSlug && targetSlug !== targetId) {
          await markGlobalItemDeleted(targetSlug, 'companies')
        }
        if (targetNumericId) {
          await markGlobalItemDeleted(targetNumericId, 'companies')
        }

        try {
          await api.delete(`/companies/${targetId}`).catch(() => {})
        } catch {}

        const remainingCompanies = companies.filter(c => 
          !isMatchingCompany(c, targetId) && 
          !isMatchingCompany(c, targetSlug) && 
          c.id !== companyId && 
          c.slug !== companyId
        )

        // ONLY remove branches belonging strictly to the deleted company!
        const remainingBranches = branches.filter(b => {
          const bComp = b.companyId || (b as any).company_id
          const isTargetBranch = isMatchingCompany({ id: targetId, slug: targetSlug, numeric_id: targetNumericId } as any, bComp)
          return !isTargetBranch
        })

        // For users belonging to deleted company: keep their company affiliation as the deleted company
        // and mark their status as Inactive / Company Deleted so login is blocked
        try {
          const currentUsers = await fetchModuleDataFromDB<any[]>('users', [], 'all')
          if (Array.isArray(currentUsers)) {
            const updatedUsers = currentUsers.map((u: any) => {
              const uCompId = String(u.companyId || u.company_id || (Array.isArray(u.companyIds) ? u.companyIds[0] : '')).toLowerCase().trim()
              const isTargetComp = 
                uCompId === String(companyId).toLowerCase().trim() ||
                uCompId === String(targetSlug).toLowerCase().trim() ||
                (targetNumericId && uCompId === targetNumericId)

              if (isTargetComp) {
                return {
                  ...u,
                  status: 'Inactive',
                  companyDeleted: true,
                  companyStatus: 'deleted',
                }
              }
              return u
            })
            await saveModuleDataToDB('users', updatedUsers, 'all')
          }
        } catch (e) {
          console.warn('Error flagging deleted company users:', e)
        }

        let newActiveCompany = activeCompanyId
        if (
          activeCompanyId === companyId || 
          activeCompanyId === targetSlug || 
          activeCompanyId?.toLowerCase() === companyId.toLowerCase() ||
          activeCompanyId?.toLowerCase() === targetSlug.toLowerCase()
        ) {
          newActiveCompany = remainingCompanies[0]?.id || remainingCompanies[0]?.slug || 'tech'
        }

        set({
          companies: remainingCompanies,
          branches: remainingBranches,
          activeCompanyId: newActiveCompany,
        })
        
        await Promise.all([
          saveModuleDataToDB('companies', remainingCompanies, 'all'),
          saveModuleDataToDB('branches', remainingBranches, 'all'),
        ]).catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('saampark_company_switched', { detail: { companyId: newActiveCompany } }))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
        }
        return true
      },

      addBranch: async (branchData: Partial<Branch>) => {
        const { user, branches } = get()
        
        let targetCompanyId = branchData.companyId || 'tech'
        if (user && user.role !== 'Super Admin') {
          const allowedCompIds = user.companyIds || (user.companyId ? [user.companyId] : ['tech'])
          const matches = allowedCompIds.some(id => id.toLowerCase() === targetCompanyId.toLowerCase())
          if (!matches) {
            targetCompanyId = allowedCompIds[0] || 'tech'
          }
        }

        const newBranch: Branch = {
          ...branchData,
          id: branchData.id || `branch_${Date.now()}`,
          companyId: targetCompanyId,
          name: branchData.name || 'New Branch',
          code: branchData.code ? branchData.code.trim().toUpperCase() : `BR-${Math.floor(100 + Math.random() * 900)}`,
          city: branchData.city || '',
          address: branchData.address || '',
          phone: branchData.phone || '',
          email: branchData.email || '',
          managerName: branchData.managerName || user?.name || '',
          status: branchData.status || 'Active',
          createdAt: new Date().toISOString().split('T')[0],
        }

        try {
          await api.post('/branches', newBranch).catch(() => {})
        } catch {}

        const updated = [...branches.filter(b => b.id !== newBranch.id), newBranch]
        set({ branches: updated })
        await saveModuleDataToDB('branches', updated, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
        }
        return newBranch
      },

      updateBranch: async (branchId: string, updates: Partial<Branch>) => {
        const { branches } = get()
        const sanitizedUpdates = {
          ...updates,
          ...(updates.code ? { code: updates.code.trim().toUpperCase() } : {}),
        }
        const updated = branches.map(b => b.id === branchId ? { ...b, ...sanitizedUpdates } : b)
        set({ branches: updated })
        await saveModuleDataToDB('branches', updated, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
        }
      },

      deleteBranch: async (branchId: string) => {
        const strId = String(branchId).toLowerCase().trim()
        const { branches } = get()
        const targetBranch = branches.find(b => {
          const bId = String(b.id).toLowerCase().trim()
          const bCode = String(b.code || '').toLowerCase().trim()
          return bId === strId || (bCode && bCode === strId)
        })

        await markGlobalItemDeleted(branchId, 'branches')
        if (targetBranch) {
          if (targetBranch.id) await markGlobalItemDeleted(targetBranch.id, 'branches')
          if (targetBranch.code) await markGlobalItemDeleted(targetBranch.code, 'branches')
        }

        try {
          await api.delete(`/branches/${encodeURIComponent(branchId)}`).catch(() => {})
          if (targetBranch?.id && String(targetBranch.id) !== branchId) {
            await api.delete(`/branches/${encodeURIComponent(String(targetBranch.id))}`).catch(() => {})
          }
        } catch {}

        const targetId = targetBranch ? String(targetBranch.id).toLowerCase().trim() : strId
        const targetCode = targetBranch?.code ? String(targetBranch.code).toLowerCase().trim() : ''

        const updated = branches.filter(b => {
          const bId = String(b.id).toLowerCase().trim()
          const bCode = String(b.code || '').toLowerCase().trim()
          if (bId === strId || bId === targetId) return false
          if (targetCode && (bId === targetCode || bCode === targetCode)) return false
          if (bCode && bCode === strId) return false
          return true
        })
        set({ branches: updated })
        await saveModuleDataToDB('branches', updated, 'all').catch(() => {})

        // Also clean up any sub-branches that were children of this deleted branch
        const { subBranches } = get()
        const updatedSub = (subBranches || []).filter(sb => {
          const pId = String(sb.parentBranchId || (sb as any).branch_id || (sb as any).branchId || '').toLowerCase().trim()
          return pId !== strId && pId !== targetId && (targetCode ? pId !== targetCode : true)
        })
        set({ subBranches: updatedSub })
        await saveModuleDataToDB('sub_branches', updatedSub, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
        }
        return true
      },

      addSubBranch: async (subBranchData: Partial<SubBranch>) => {
        const { subBranches, branches } = get()
        const parentBranch = branches.find(b => b.id === subBranchData.parentBranchId)
        const targetCompId = subBranchData.companyId || parentBranch?.companyId || 'tech'

        const newSubBranch: SubBranch = {
          ...subBranchData,
          id: subBranchData.id || `subbranch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          parentBranchId: subBranchData.parentBranchId || '',
          companyId: targetCompId,
          name: subBranchData.name || 'New Sub-Branch',
          code: subBranchData.code || `SB-${Math.floor(100 + Math.random() * 900)}`,
          partnerName: subBranchData.partnerName || '',
          partnerPhone: subBranchData.partnerPhone || '',
          partnerEmail: subBranchData.partnerEmail || '',
          city: subBranchData.city || '',
          address: subBranchData.address || '',
          revenueSharePct: subBranchData.revenueSharePct !== undefined ? Number(subBranchData.revenueSharePct) : 30,
          partnerType: subBranchData.partnerType || 'Franchise Partner',
          status: subBranchData.status || 'Active',
          createdAt: new Date().toISOString().split('T')[0],
        }

        try {
          await api.post('/branches/sub-branches', newSubBranch).catch(() => {})
        } catch {}

        const updated = [...(subBranches || []).filter(sb => sb.id !== newSubBranch.id), newSubBranch]
        set({ subBranches: updated })
        await saveModuleDataToDB('sub_branches', updated, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
          window.dispatchEvent(new CustomEvent('saampark_subbranches_updated', { detail: newSubBranch }))
        }
        return newSubBranch
      },

      updateSubBranch: async (subBranchId: string, updates: Partial<SubBranch>) => {
        const { subBranches } = get()
        const updated = (subBranches || []).map(sb => sb.id === subBranchId ? { ...sb, ...updates } : sb)
        set({ subBranches: updated })
        await saveModuleDataToDB('sub_branches', updated, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
          window.dispatchEvent(new CustomEvent('saampark_subbranches_updated'))
        }
      },

      deleteSubBranch: async (subBranchId: string) => {
        const strId = String(subBranchId).toLowerCase().trim()
        const { subBranches } = get()
        const targetSub = (subBranches || []).find(sb => {
          const sId = String(sb.id).toLowerCase().trim()
          const sCode = String(sb.code || '').toLowerCase().trim()
          return sId === strId || (sCode && sCode === strId)
        })

        await markGlobalItemDeleted(subBranchId, 'sub_branches')
        if (targetSub) {
          if (targetSub.id) await markGlobalItemDeleted(targetSub.id, 'sub_branches')
          if (targetSub.code) await markGlobalItemDeleted(targetSub.code, 'sub_branches')
        }

        try {
          await api.delete(`/branches/sub-branches/${encodeURIComponent(subBranchId)}`).catch(() => {})
          if (targetSub?.id && String(targetSub.id) !== subBranchId) {
            await api.delete(`/branches/sub-branches/${encodeURIComponent(String(targetSub.id))}`).catch(() => {})
          }
        } catch {}

        const targetId = targetSub ? String(targetSub.id).toLowerCase().trim() : strId
        const targetCode = targetSub?.code ? String(targetSub.code).toLowerCase().trim() : ''

        const updated = (subBranches || []).filter(sb => {
          const sId = String(sb.id).toLowerCase().trim()
          const sCode = String(sb.code || '').toLowerCase().trim()
          if (sId === strId || sId === targetId) return false
          if (targetCode && (sId === targetCode || sCode === targetCode)) return false
          if (sCode && sCode === strId) return false
          return true
        })
        set({ subBranches: updated })
        await saveModuleDataToDB('sub_branches', updated, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
          window.dispatchEvent(new CustomEvent('saampark_subbranches_updated'))
        }
        return true
      },



      loginAs: (role: Role | string, customUser?: Partial<User>) => {
        let normalizedRole: Role = 'Teams'
        const userEmail = (customUser?.email || '').toLowerCase().trim()
        if (
          userEmail === 'hiisupriya@gmail.com' || 
          userEmail === 'supriyo.main@gmail.com' || 
          userEmail === 'saampark.official@gmail.com'
        ) {
          normalizedRole = 'Super Admin'
        } else {
          const rLower = String(role || '').toLowerCase().trim()
          if (rLower.includes('super')) normalizedRole = 'Super Admin'
          else if (rLower.includes('admin')) normalizedRole = 'Admin'
          else if (rLower.includes('client')) normalizedRole = 'Clients'
        }

        const assignedCompanyIds = customUser?.companyIds || (normalizedRole === 'Super Admin' ? ['tech', 'consultancy'] : [customUser?.companyId || 'tech'])

        let parsedPerms: any = customUser?.permissions
        if (typeof parsedPerms === 'string') {
          try { parsedPerms = JSON.parse(parsedPerms) } catch {}
        }

        const userAllowedMods =
          customUser?.allowedModules ||
          (parsedPerms && Array.isArray(parsedPerms.allowedModules) ? parsedPerms.allowedModules : undefined)

        const rawBranch = customUser?.branchId || (customUser as any)?.branch_id || undefined
        const rawBranchName = customUser?.branchName || (customUser as any)?.branch_name || undefined
        const rawSubBranch = customUser?.subBranchId || (customUser as any)?.sub_branch_id || (customUser as any)?.subBranchIds?.[0] || undefined
        const rawSubBranchName = customUser?.subBranchName || (customUser as any)?.sub_branch_name || undefined

        const user: User = {
          id: customUser?.id || `u_${Date.now()}`,
          name: (userEmail === 'hiisupriya@gmail.com' || userEmail === 'supriyo.main@gmail.com' || userEmail === 'saampark.official@gmail.com')
            ? 'Supriya (Super Admin)'
            : (customUser?.name || `${normalizedRole} User`),
          email: (customUser?.email || 'user@saampark.in').toLowerCase().trim(),
          username: (customUser as any)?.username || undefined,
          role: normalizedRole,
          companyId: customUser?.companyId || assignedCompanyIds[0] || 'tech',
          companyIds: assignedCompanyIds,
          branchId: rawBranch,
          branchName: rawBranchName,
          subBranchId: rawSubBranch,
          subBranchIds: customUser?.subBranchIds || (rawSubBranch ? [rawSubBranch] : undefined),
          subBranchName: rawSubBranchName,
          avatar: customUser?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${customUser?.email || normalizedRole}`,
          phone: customUser?.phone,
          allowedModules: normalizedRole === 'Super Admin' ? undefined : userAllowedMods,
          permissions: parsedPerms || customUser?.permissions,
        }

        // Direct company and branch routing
        let activeCompanyId = 'tech'
        if (normalizedRole === 'Super Admin') {
          activeCompanyId = 'all'
        } else if (user.companyId) {
          activeCompanyId = user.companyId
        } else if (assignedCompanyIds.length === 1) {
          activeCompanyId = assignedCompanyIds[0]
        }

        const activeBranchId = (normalizedRole !== 'Super Admin' && rawBranch) ? rawBranch : null
        const activeSubBranchId = (normalizedRole !== 'Super Admin' && rawSubBranch) ? rawSubBranch : null

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('saampark_session_active', 'true')
          localStorage.setItem('saampark_last_activity_time', String(Date.now()))
        }

        set({
          isAuthenticated: true,
          user,
          activeCompanyId,
          activeBranchId,
          activeSubBranchId,
        })

        // Synchronize permissions store immediately on login
        try {
          const { usePermissionStore } = require('./usePermissionStore')
          if (parsedPerms && parsedPerms.actionMatrix) {
            usePermissionStore.getState().setUserAllModuleActions(user.id, parsedPerms.actionMatrix)
            if (user.email) {
              usePermissionStore.getState().setUserAllModuleActions(user.email, parsedPerms.actionMatrix)
            }
          }
          if (userAllowedMods) {
            usePermissionStore.getState().setUserPermissions(user.id, userAllowedMods)
            if (user.email) {
              usePermissionStore.getState().setUserPermissions(user.email, userAllowedMods)
            }
          }
        } catch {}
      },

      loginWithCredentials: async (emailOrUsername: string, password: string) => {
        const normIdentifier = emailOrUsername.toLowerCase().trim()
        try {
          const res = await AuthService.login({ email: normIdentifier, password })
          if (res && res.token) {
            let role: Role = 'Teams'
            const uRole = res.user?.role_name || res.user?.role || ''
            const uRoleId = res.user?.role_id
            if (uRoleId === 1 || String(uRole).toLowerCase().includes('super')) {
              role = 'Super Admin'
            } else if (uRoleId === 2 || String(uRole).toLowerCase().includes('admin')) {
              role = 'Admin'
            } else if (uRoleId === 4 || String(uRole).toLowerCase().includes('client')) {
              role = 'Clients'
            }

            let parsedCompanyIds: string[] = []
            if (res.user?.company_ids) {
              try {
                parsedCompanyIds = JSON.parse(res.user.company_ids)
              } catch {
                parsedCompanyIds = [res.user.company_ids]
              }
            }
            if (!Array.isArray(parsedCompanyIds) || parsedCompanyIds.length === 0) {
              parsedCompanyIds = [res.user?.company_id || 'tech']
            }

            let resPerms: any = res.user?.permissions
            if (typeof resPerms === 'string') {
              try { resPerms = JSON.parse(resPerms) } catch {}
            }

            const userAllowedMods =
              res.user?.allowedModules ||
              (resPerms && Array.isArray(resPerms.allowedModules) ? resPerms.allowedModules : undefined)

            const userBranch = res.user?.branch_id || res.user?.branchId || res.user?.branch || undefined
            const userSubBranch = res.user?.sub_branch_id || res.user?.subBranchId || undefined

            const primaryCompany = res.user?.company_id || parsedCompanyIds[0] || 'tech'

            const userObj: User = {
              id: res.user?.id || 'u_live',
              name: res.user?.full_name || res.user?.name || res.user?.email || 'User',
              email: res.user?.email || (normIdentifier.includes('@') ? normIdentifier : 'user@saampark.in'),
              username: res.user?.username || (!normIdentifier.includes('@') ? normIdentifier : undefined),
              role: role,
              companyId: primaryCompany,
              companyIds: parsedCompanyIds,
              branchId: userBranch,
              branchName: res.user?.branch_name || res.user?.branchName || undefined,
              subBranchId: userSubBranch,
              subBranchIds: userSubBranch ? [userSubBranch] : undefined,
              subBranchName: res.user?.sub_branch_name || res.user?.subBranchName || undefined,
              avatar: res.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${res.user?.email || 'user'}`,
              phone: res.user?.phone,
              allowedModules: userAllowedMods,
              permissions: resPerms || res.user?.permissions,
            }

            const effectiveCompanyId = (role === 'Super Admin') ? 'all' : primaryCompany
            const initialBranchId = (role !== 'Super Admin' && userBranch) ? userBranch : null
            const initialSubBranchId = (role !== 'Super Admin' && userSubBranch) ? userSubBranch : null

            if (typeof window !== 'undefined') {
              sessionStorage.setItem('saampark_session_active', 'true')
              localStorage.setItem('saampark_last_activity_time', String(Date.now()))
            }

            set({
              isAuthenticated: true,
              token: res.token,
              user: userObj,
              activeCompanyId: effectiveCompanyId,
              activeBranchId: initialBranchId,
              activeSubBranchId: initialSubBranchId,
            })

            // Synchronize permissions store immediately on login
            try {
              const { usePermissionStore } = require('./usePermissionStore')
              if (resPerms && resPerms.actionMatrix) {
                usePermissionStore.getState().setUserAllModuleActions(userObj.id, resPerms.actionMatrix)
                if (userObj.email) {
                  usePermissionStore.getState().setUserAllModuleActions(userObj.email, resPerms.actionMatrix)
                }
              }
              if (userAllowedMods) {
                usePermissionStore.getState().setUserPermissions(userObj.id, userAllowedMods)
                if (userObj.email) {
                  usePermissionStore.getState().setUserPermissions(userObj.email, userAllowedMods)
                }
              }
            } catch {}

            // Fetch dynamic company list on login
            get().fetchCompanies()

            return true
          }
          
          if (res && (res.status === 'error' || res.message)) {
            throw new Error(res.message || "Account does not exist. Please create one.")
          }

          return false
        } catch (err) {
          console.error('Login error:', err)
          throw err
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('saampark_session_active')
          localStorage.removeItem('saampark_last_activity_time')
        }
        AuthService.logout()
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          activeCompanyId: null,
        })
      },

      switchCompany: (companyId: string) => {
        const { user, companies, branches, subBranches } = get()
        if (!user) return

        const targetNorm = String(companyId || '').toLowerCase().trim()
        const isSuperAdmin = user.role === 'Super Admin'

        if (targetNorm === 'all' || targetNorm === 'all_companies' || !companyId) {
          if (isSuperAdmin) {
            invalidateModuleCache()
            set({
              activeCompanyId: 'all',
              activeBranchId: null,
              activeSubBranchId: null,
            })
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('saampark_company_switched', { detail: 'all' }))
              window.dispatchEvent(new CustomEvent('saampark_branch_switched', { detail: null }))
              window.dispatchEvent(new CustomEvent('saampark_sub_branch_switched', { detail: null }))
              window.dispatchEvent(new CustomEvent('saampark_data_synced'))
              window.dispatchEvent(new Event('storage'))
            }
            return
          } else {
            console.warn("Only Super Admin can switch to All Companies global scope.")
            return
          }
        }

        const scope = getUserEntityScope(user, companies, branches, subBranches)

        const matchedComp = companies.find(c => 
          String(c.id).toLowerCase().trim() === targetNorm || 
          String(c.slug || '').toLowerCase().trim() === targetNorm ||
          String(c.name || '').toLowerCase().trim() === targetNorm
        )
        const effectiveId = matchedComp?.id || companyId
        
        // Scope Verification: User must have access to this company
        const isAllowedCompany = isSuperAdmin || scope.allowedCompanyIds.some(id => 
          String(id).toLowerCase().trim() === targetNorm ||
          (matchedComp && String(id).toLowerCase().trim() === String(matchedComp.id).toLowerCase().trim()) ||
          (matchedComp?.slug && String(id).toLowerCase().trim() === String(matchedComp.slug).toLowerCase().trim())
        )

        if (!isAllowedCompany) {
          console.warn(`Access denied: User does not have access to company ${effectiveId}`)
          return
        }

        invalidateModuleCache()

        // If user is locked to a branch or sub-branch, automatically pin their active branch / sub-branch
        let nextBranchId: string | null = null
        let nextSubBranchId: string | null = null

        if (scope.scopeLevel === 'subbranch') {
          nextSubBranchId = scope.allowedSubBranchIds[0] || null
          nextBranchId = scope.allowedBranchIds[0] || null
        } else if (scope.scopeLevel === 'branch') {
          nextBranchId = scope.allowedBranchIds[0] || null
        }

        set({
          activeCompanyId: effectiveId,
          activeBranchId: nextBranchId,
          activeSubBranchId: nextSubBranchId,
        })

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('saampark_company_switched', { detail: effectiveId }))
          window.dispatchEvent(new CustomEvent('saampark_branch_switched', { detail: nextBranchId }))
          window.dispatchEvent(new CustomEvent('saampark_sub_branch_switched', { detail: nextSubBranchId }))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
          window.dispatchEvent(new Event('storage'))
        }
      },

      switchBranch: (branchId: string | null) => {
        const { user, companies, branches, subBranches, activeCompanyId } = get()
        if (!user) return

        const scope = getUserEntityScope(user, companies, branches, subBranches)
        const branchIdStr = branchId ? String(branchId) : null
        
        // If unsetting branch (trying to stay at Company Headquarters):
        if (!branchIdStr) {
          if (!scope.canAccessCompanyHq) {
            console.warn("Access denied: Users assigned strictly to a branch or sub-branch cannot access company corporate headquarters.")
            return
          }
          invalidateModuleCache()
          set({
            activeBranchId: null,
            activeSubBranchId: null,
          })
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('saampark_branch_switched', { detail: null }))
            window.dispatchEvent(new CustomEvent('saampark_sub_branch_switched', { detail: null }))
            window.dispatchEvent(new CustomEvent('saampark_data_synced'))
            window.dispatchEvent(new Event('storage'))
          }
          return
        }

        // Strict Hierarchical Rule: Must be inside the Company first before switching to its branch
        if (!activeCompanyId || activeCompanyId === 'all') {
          console.warn("Hierarchical switching violation: You must select a specific Company before switching to a Branch.")
          return
        }

        // Scope check: User must be allowed to access this branch
        const isAllowedBranch = scope.isSuperAdmin || scope.allowedBranchIds.some(id => 
          String(id).toLowerCase().trim() === branchIdStr.toLowerCase().trim()
        )
        if (!isAllowedBranch) {
          console.warn(`Access denied: User does not have access to branch ${branchIdStr}`)
          return
        }

        const matchedBranch = branches.find(b => String(b.id) === branchIdStr)
        if (matchedBranch) {
          const bComp = String(matchedBranch.companyId || (matchedBranch as any)?.company_id || '').toLowerCase()
          const activeComp = String(activeCompanyId || '').toLowerCase()
          const isMatch = isMatchingCompany({ id: bComp, slug: bComp } as any, activeCompanyId)
          if (!isMatch) {
            console.warn(`Hierarchical switching violation: Branch ${matchedBranch.name} does not belong to active company ${activeCompanyId}. Switch to that company first.`)
            return
          }
        }

        invalidateModuleCache()

        // If user is subbranch-scoped, pin their active sub-branch
        let nextSubBranchId: string | null = null
        if (scope.scopeLevel === 'subbranch') {
          nextSubBranchId = scope.allowedSubBranchIds[0] || null
        }

        set({
          activeBranchId: branchIdStr,
          activeSubBranchId: nextSubBranchId,
        })

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('saampark_branch_switched', { detail: branchIdStr }))
          window.dispatchEvent(new CustomEvent('saampark_sub_branch_switched', { detail: nextSubBranchId }))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
          window.dispatchEvent(new Event('storage'))
        }
      },

      switchSubBranch: (subBranchId: string | null) => {
        const { user, companies, branches, subBranches, activeCompanyId, activeBranchId } = get()
        if (!user) return

        const scope = getUserEntityScope(user, companies, branches, subBranches)
        const subBranchIdStr = subBranchId ? String(subBranchId) : null

        // If unsetting sub-branch:
        if (!subBranchIdStr) {
          if (scope.scopeLevel === 'subbranch') {
            console.warn("Access denied: Users scoped strictly to a sub-branch cannot unselect their sub-branch.")
            return
          }
          set({ activeSubBranchId: null })
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('saampark_sub_branch_switched', { detail: null }))
            window.dispatchEvent(new CustomEvent('saampark_subbranch_switched', { detail: { subBranchId: null } }))
            window.dispatchEvent(new CustomEvent('saampark_data_synced'))
            window.dispatchEvent(new Event('storage'))
          }
          return
        }

        // Strict Hierarchical Rule: Must be inside Company AND Branch before switching to a Sub-Branch
        if (!activeCompanyId || activeCompanyId === 'all') {
          console.warn("Hierarchical switching violation: Select Company first.")
          return
        }
        if (!activeBranchId) {
          console.warn("Hierarchical switching violation: You must select a parent Branch before switching to a Sub-Branch.")
          return
        }

        // Scope check: User must be allowed to access this sub-branch
        const isAllowedSub = scope.isSuperAdmin || scope.allowedSubBranchIds.some(id =>
          String(id).toLowerCase().trim() === subBranchIdStr.toLowerCase().trim()
        )
        if (!isAllowedSub) {
          console.warn(`Access denied: User does not have access to sub-branch ${subBranchIdStr}`)
          return
        }

        const matchedSub = subBranches.find(sb => String(sb.id) === subBranchIdStr)
        if (matchedSub && String(matchedSub.parentBranchId) !== String(activeBranchId)) {
          console.warn(`Hierarchical switching violation: Sub-branch ${matchedSub.name} does not belong to active branch ${activeBranchId}.`)
          return
        }

        set({ activeSubBranchId: subBranchIdStr })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('saampark_sub_branch_switched', { detail: subBranchIdStr }))
          window.dispatchEvent(new CustomEvent('saampark_subbranch_switched', { detail: { subBranchId: subBranchIdStr } }))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
          window.dispatchEvent(new Event('storage'))
        }
      },
    }),
    {
      name: 'saampark-auth-v3',
      onRehydrateStorage: () => (state) => {
        if (state && state.user && state.user.role === 'Super Admin') {
          if (!state.activeCompanyId) {
            state.activeCompanyId = 'all'
            state.activeBranchId = null
            state.activeSubBranchId = null
          }
        }
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
        activeCompanyId: state.activeCompanyId,
        activeBranchId: state.activeBranchId,
        activeSubBranchId: state.activeSubBranchId,
      }),
    }
  )
)
