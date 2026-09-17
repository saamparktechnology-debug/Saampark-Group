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
  terms_conditions?: string
  invoice_notes?: string
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
  terms_conditions?: string
  invoice_notes?: string
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
  slug?: string
  logo?: string
  logo_url?: string
  currency?: string
  currency_symbol?: string
  // Legal & Registration IDs
  cin?: string
  gstin?: string
  pan?: string
  // Address & Contact Information
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  // Bank & Payment Gateway Details
  upi_id?: string
  account_holder?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  bank_branch?: string
  swift_code?: string
  payment_qr_url?: string
  // Invoice Customization
  terms_conditions?: string
  invoice_notes?: string
  signatory_name?: string
  signatory_designation?: string
  signature_image_url?: string
  stamp_image_url?: string
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
  const canon = getCanonicalCompanyId(company.slug || company.id || (company as any)?.numeric_id || company.name)
  const brand = (company.brand_name || "SAAMPARK").trim()
  
  if (canon === "tech" || canon === "1") {
    let div = (company.division_name || "").trim()
    if (!div || div.toLowerCase().includes("consult")) div = "TECHNOLOGY"
    return `${brand} ${div}`.trim()
  }

  if (canon === "consultancy" || canon === "2") {
    let div = (company.division_name || "").trim()
    if (!div || div.toLowerCase().includes("tech")) div = "CONSULTANCY SERVICE"
    return `${brand} ${div}`.trim()
  }

  const rawBrand = (company.brand_name || "").trim()
  const rawDivision = (company.division_name || "").trim()
  const rawName = (company.name || "").trim()

  if (rawDivision) {
    return `${rawBrand || "SAAMPARK"} ${rawDivision}`
  }

  return rawName || rawBrand || "SAAMPARK"
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

export const DEFAULT_COMPANIES: Company[] = [
  { 
    id: 'tech', 
    numeric_id: 1,
    brand_name: 'SAAMPARK',
    division_name: 'TECHNOLOGY',
    name: 'SAAMPARK TECHNOLOGY', 
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
    account_holder: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    bank_branch: '',
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
    address: 'Salt Lake Sector V, Bidhannagar, Kolkata, West Bengal - 700091',
    phone: '+91 9901518570',
    email: 'consultancy@saampark.in',
    website: 'www.saampark.in',
    upi_id: '',
    account_holder: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    bank_branch: '',
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

          // 2. Fetch from backend API (companies table directly)
          let apiList: Company[] = []
          const res: any = await api.get('/companies').catch(() => null)
          if (res && (Array.isArray(res.data) || Array.isArray(res))) {
            const list = Array.isArray(res.data) ? res.data : res
            apiList = list.map((c: any) => ({
              id: c.slug || String(c.id),
              numeric_id: c.id,
              name: c.name,
              brand_name: c.brand_name || (c.name?.startsWith('SAAMPARK') ? 'SAAMPARK' : c.name),
              division_name: c.division_name || (c.name ? c.name.replace(/^SAAMPARK\s+/i, '') : ''),
              subtitle: c.subtitle || '',
              slug: c.slug || String(c.id),
              logo: c.logo || (c.slug === 'digital' ? '📈' : (c.slug === 'saampark-ai-solutions' ? '🤖' : '💻')),
              logo_url: c.logo_url || '',
              currency: c.currency || 'INR',
              currency_symbol: c.currency_symbol || '₹',
              industry: c.industry || 'Technology',
              address: c.address || '',
            }))
          }

          const map = new Map<string, Company>()

          const getCanonicalKey = (c: Partial<Company>) => {
            const canon = getCanonicalCompanyId(c.slug || c.id || (c as any)?.numeric_id || c.name)
            if (canon === 'consultancy' || canon.includes('consult')) return 'consultancy'
            return 'tech'
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

          const sanitizedTech: Company = {
            ...DEFAULT_COMPANIES[0],
            ...rawTech,
            id: 'tech',
            slug: 'tech',
            numeric_id: 1,
            brand_name: 'SAAMPARK',
            division_name: (rawTech.division_name && !rawTech.division_name.toLowerCase().includes('consult')) ? rawTech.division_name : 'TECHNOLOGY',
            subtitle: (rawTech.subtitle && !rawTech.subtitle.toLowerCase().includes('consult')) ? rawTech.subtitle : 'AND RESEARCH PRIVATE LIMITED',
            name: 'SAAMPARK TECHNOLOGY',
            logo: '💻',
            logo_url: (rawTech.logo_url && rawTech.logo_url.trim() !== '') ? rawTech.logo_url : '/saampark-logo.png',
          }

          const sanitizedConsult: Company = {
            ...DEFAULT_COMPANIES[1],
            ...rawConsult,
            id: 'consultancy',
            slug: 'consultancy',
            numeric_id: 2,
            brand_name: 'SAAMPARK',
            division_name: 'CONSULTANCY SERVICE',
            subtitle: (rawConsult.subtitle && !rawConsult.subtitle.toLowerCase().includes('research') && !rawConsult.subtitle.toLowerCase().includes('technology')) ? rawConsult.subtitle : 'MANAGEMENT & ADVISORY SERVICES',
            name: 'SAAMPARK CONSULTANCY SERVICE',
            logo: '💼',
            // Consultancy starts totally fresh — never inherit technology logo
            logo_url: (rawConsult.logo_url && rawConsult.logo_url !== '/saampark-logo.png') ? rawConsult.logo_url : '',
          }

          const combined = [sanitizedTech, sanitizedConsult] as Company[]

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

          const dbBranches = await fetchModuleDataFromDB<Branch[]>('branches', [], 'all').catch(() => null)
          
          let list: Branch[] = []
          if (Array.isArray(dbBranches) && dbBranches.length > 0) {
            list = dbBranches
          } else {
            const res: any = await api.get('/branches', { headers: { 'x-company-id': 'all' } }).catch(() => null)
            if (res && (Array.isArray(res.data) || Array.isArray(res))) {
              list = Array.isArray(res.data) ? res.data : res
            }
          }

          // Ensure canonical default branches (tech br-1, br-2) are always preserved as baseline unless deleted
          const branchMap = new Map<string, Branch>()
          DEFAULT_BRANCHES.forEach(b => {
            if (!isBranchDeleted(b.id, b.code)) {
              branchMap.set(String(b.id), { ...b, company_id: (b as any).company_id || (b.companyId === 'tech' ? 1 : 1) })
            }
          })

          list.forEach(b => {
            if (!isBranchDeleted(b.id, b.code)) {
              const strKey = String(b.id)
              const existing = branchMap.get(strKey)
              branchMap.set(strKey, { ...existing, ...b })
            }
          })

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
            signatory_name: newComp.signatory_name || '',
            signatory_designation: newComp.signatory_designation || '',
            signature_image_url: newComp.signature_image_url || '',
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
        if (user?.role !== 'Super Admin') {
          throw new Error('Only Super Admin can modify company details.')
        }

        const compIndex = companies.findIndex(c => 
          String(c.id).toLowerCase() === String(companyId).toLowerCase() || 
          String(c.slug || '').toLowerCase() === String(companyId).toLowerCase() ||
          String((c as any).numeric_id || '').toLowerCase() === String(companyId).toLowerCase() ||
          isMatchingCompany(c, companyId)
        )
        if (compIndex === -1) return null

        const target = companies[compIndex]
        const merged: Company = {
          ...target,
          ...updates,
          brand_name: updates.brand_name !== undefined ? updates.brand_name : (target.brand_name || 'SAAMPARK'),
          division_name: updates.division_name !== undefined ? updates.division_name : (target.division_name || ''),
          subtitle: updates.subtitle !== undefined ? updates.subtitle : (target.subtitle || ''),
          logo_url: updates.logo_url !== undefined ? updates.logo_url : (target.logo_url || ''),
          name: updates.name || getCompanyFullName({ ...target, ...updates }),
        }

        // Try backend API update if available
        try {
          const apiTargetId = (target as any).numeric_id || target.id
          await api.put(`/companies/${apiTargetId}`, {
            name: merged.name,
            slug: merged.slug || merged.id,
            currency: merged.currency,
            currency_symbol: merged.currency_symbol,
            logo_url: merged.logo_url,
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

      switchSubBranch: (subBranchId: string | null) => {
        set({ activeSubBranchId: subBranchId })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('saampark_subbranch_switched', { detail: { subBranchId } }))
        }
      },

      switchBranch: (branchId: string | null) => {
        const { user } = get()
        if (!user) return

        let rawBranchIds = user.branchIds || (user as any).branch_ids
        let userBranchIds: string[] = []
        if (typeof rawBranchIds === 'string') {
          try { userBranchIds = JSON.parse(rawBranchIds) } catch { userBranchIds = [rawBranchIds] }
        } else if (Array.isArray(rawBranchIds)) {
          userBranchIds = rawBranchIds
        }
        if (userBranchIds.length === 0 && user.branchId) {
          userBranchIds = [user.branchId]
        }

        const isSuperAdmin = user.role === 'Super Admin'
        const hasNoBranchRestriction = userBranchIds.length === 0

        const canSwitch =
          isSuperAdmin ||
          hasNoBranchRestriction ||
          (!branchId && (userBranchIds.length > 1 || user.role === 'Admin')) ||
          (branchId && userBranchIds.some(id => String(id).toLowerCase().trim() === String(branchId).toLowerCase().trim()))

        if (canSwitch) {
          invalidateModuleCache()
          set({ activeBranchId: branchId })
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('saampark_branch_switched', { detail: branchId }))
            window.dispatchEvent(new CustomEvent('saampark_data_synced'))
            window.dispatchEvent(new Event('storage'))
          }
        }
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

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('saampark_session_active', 'true')
          localStorage.setItem('saampark_last_activity_time', String(Date.now()))
        }

        set({
          isAuthenticated: true,
          user,
          activeCompanyId,
          activeBranchId,
        })
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
              avatar: res.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${res.user?.email || 'user'}`,
              phone: res.user?.phone,
              allowedModules: userAllowedMods,
              permissions: resPerms || res.user?.permissions,
            }

            const effectiveCompanyId = (role === 'Super Admin') ? 'all' : primaryCompany
            const initialBranchId = (role !== 'Super Admin' && userBranch) ? userBranch : null

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
            })

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
        const { user, companies } = get()
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
              window.dispatchEvent(new CustomEvent('saampark_data_synced'))
              window.dispatchEvent(new Event('storage'))
            }
            return
          }
        }

        const matchedComp = companies.find(c => 
          String(c.id).toLowerCase().trim() === targetNorm || 
          String(c.slug || '').toLowerCase().trim() === targetNorm ||
          String(c.name || '').toLowerCase().trim() === targetNorm
        )
        const effectiveId = matchedComp?.id || companyId
        
        // Super Admin can switch to any company.
        // Admins, Teams, Clients can switch between any company they are assigned to.
        const userCompIds = (user.companyIds && user.companyIds.length > 0)
          ? user.companyIds.map(id => String(id).toLowerCase().trim())
          : [String(user.companyId || 'tech').toLowerCase().trim()]

        const canSwitch =
          isSuperAdmin ||
          userCompIds.includes(targetNorm) ||
          (matchedComp && userCompIds.includes(String(matchedComp.id).toLowerCase().trim())) ||
          (matchedComp?.slug && userCompIds.includes(String(matchedComp.slug).toLowerCase().trim())) ||
          String(user.companyId).toLowerCase().trim() === targetNorm

        if (canSwitch) {
          invalidateModuleCache()

          // If Super Admin, ensure companyIds includes this company so session sync doesn't reset it
          let updatedCompanyIds = user.companyIds || [effectiveId]
          if (isSuperAdmin && !updatedCompanyIds.includes(effectiveId)) {
            updatedCompanyIds = [...updatedCompanyIds, effectiveId]
          }

          const updatedUser = {
            ...user,
            companyId: effectiveId as any,
            companyIds: updatedCompanyIds,
          }

          set({
            activeCompanyId: effectiveId,
            activeBranchId: null,
            user: updatedUser,
          })

          // Save updated active companyId to user account persistence
          import('@/app/feature/users/services/userService').then(({ recordUserAccount }) => {
            recordUserAccount({
              ...updatedUser,
              id: String(updatedUser.id),
              companyId: effectiveId as any,
              companyIds: updatedCompanyIds,
            })
          }).catch(() => {})

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('saampark_company_switched', { detail: effectiveId }))
            window.dispatchEvent(new CustomEvent('saampark_branch_switched', { detail: null }))
            window.dispatchEvent(new CustomEvent('saampark_data_synced'))
            window.dispatchEvent(new Event('storage'))
          }
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
          }
        }
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
        activeCompanyId: state.activeCompanyId,
        activeBranchId: state.activeBranchId,
      }),
    }
  )
)
