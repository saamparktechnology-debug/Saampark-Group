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
  if (!company) return "SAAMPARK"
  const rawBrand = (company.brand_name || "").trim()
  const rawDivision = (company.division_name || "").trim()
  const rawSubtitle = (company.subtitle || "").trim()
  const rawName = (company.name || "").trim()

  // 1. If division is explicitly set, ALWAYS format as Brand + Division
  if (rawDivision) {
    const brand = rawBrand || "SAAMPARK"
    return `${brand} ${rawDivision}`
  }

  // 2. If subtitle is present and division is empty
  if (rawSubtitle) {
    const brand = rawBrand || "SAAMPARK"
    if (rawSubtitle.toLowerCase().startsWith("and ") || rawSubtitle.toLowerCase().startsWith("& ")) {
      return `${brand} ${rawSubtitle.replace(/^(&|and)\s+/i, "")}`
    }
    if (!rawSubtitle.toLowerCase().includes("private limited") && !rawSubtitle.toLowerCase().includes("pvt ltd")) {
      return `${brand} ${rawSubtitle}`
    }
    const cleanSub = rawSubtitle.replace(/\s+(pvt\.?\s*ltd\.?|private\s+limited|llp|inc\.?)$/i, "").trim()
    if (cleanSub) {
      return `${brand} ${cleanSub}`
    }
  }

  // 3. If explicit name has multiple words or full name beyond just "SAAMPARK"
  if (rawName && rawName.toLowerCase() !== "saampark" && rawName.toLowerCase() !== "saampark group") {
    return rawName
  }

  // 4. If brand is distinctive
  if (rawBrand && rawBrand.toLowerCase() !== "saampark" && rawBrand.toLowerCase() !== "saampark group") {
    return rawBrand
  }

  // 5. Fallback inspection based on slug / id
  const slugOrId = String(company.slug || company.id || "").toLowerCase()
  if (slugOrId === "tech" || slugOrId.includes("tech")) return "SAAMPARK TECHNOLOGY"
  if (slugOrId === "digital" || slugOrId.includes("digital")) return "SAAMPARK DIGITAL MARKETING"
  if (slugOrId.includes("consult")) return "SAAMPARK CONSULTANCY"
  if (slugOrId.includes("print")) return "SAAMPARK PRINT SPACE"
  if (slugOrId.includes("media")) return "SAAMPARK MEDIA"

  return rawName || rawBrand || "SAAMPARK"
}

export function isMatchingCompany(
  comp: Partial<Company> | null | undefined, 
  targetIdOrSlug: string | number | null | undefined
): boolean {
  if (!comp || targetIdOrSlug === null || targetIdOrSlug === undefined) return false
  const target = String(targetIdOrSlug).toLowerCase().trim()
  if (!target) return false
  return (
    String(comp.id || "").toLowerCase().trim() === target ||
    String(comp.slug || "").toLowerCase().trim() === target ||
    String(comp.name || "").toLowerCase().trim() === target
  )
}

export const DEFAULT_COMPANIES: Company[] = [
  { 
    id: 'tech', 
    brand_name: 'SAAMPARK',
    division_name: 'TECHNOLOGY',
    name: 'SAAMPARK TECHNOLOGY', 
    subtitle: 'AND RESEARCH PRIVATE LIMITED',
    logo: '💻', 
    logo_url: '/saampark-logo.png',
    slug: 'tech', 
    currency: 'INR',
    currency_symbol: '₹',
    cin: 'U72900WB2024PTC271234',
    gstin: '19ABFCS1234D1ZS',
    pan: 'ABFCS1234D',
    address: 'Madinipur, Kolkata, Durgapur, West Bengal, India - 721101',
    phone: '+91 9901518567 / +91 9901518569',
    email: 'info@saamparktechnology.com',
    website: 'www.saamparktechnology.com',
    upi_id: 'saampark@sbi',
    account_holder: 'Saampark Technology & Research Pvt. Ltd.',
    bank_name: 'State Bank of India',
    account_number: '40912384759',
    ifsc_code: 'SBIN0001234',
    bank_branch: 'Balichak Station Road',
    terms_conditions: '1. E.& O.E.\n2. Total payment due to be paid within due date to avoid suspension/cancellation.\n3. Please include the invoice number in your payment notes.\n4. All disputes are subject to Paschim Medinipur jurisdiction only.\n5. For payment & refund related queries, read our Refund & Return Policy on website.',
    signatory_name: 'Authorized Signatory',
    signatory_designation: 'Managing Director'
  },
  { 
    id: 'digital', 
    brand_name: 'SAAMPARK',
    division_name: 'DIGITAL MARKETING',
    name: 'SAAMPARK DIGITAL MARKETING', 
    subtitle: 'RESEARCH & CREATIVE MEDIA AGENCY',
    logo: '📈', 
    logo_url: '/saampark-logo.png',
    slug: 'digital', 
    currency: 'INR',
    currency_symbol: '₹',
    cin: 'U74999WB2024PTC271890',
    gstin: '19AAGCS5678E1ZT',
    pan: 'AAGCS5678E',
    address: 'Salt Lake Sector V, Bidhannagar, Kolkata, West Bengal - 700091',
    phone: '+91 9901518570',
    email: 'digital@saampark.in',
    website: 'www.saamparkdigital.com',
    upi_id: 'saamparkdigital@icici',
    account_holder: 'Saampark Digital Marketing & Research',
    bank_name: 'ICICI Bank',
    account_number: '123405009876',
    ifsc_code: 'ICIC0001234',
    bank_branch: 'Sector V Kolkata',
    terms_conditions: '1. All marketing campaigns will be initiated after advance retainer clearance.\n2. Advertising budget spend is billed directly via client ad account.\n3. All disputes are subject to Kolkata jurisdiction only.',
    signatory_name: 'Authorized Signatory',
    signatory_designation: 'Agency Head'
  },
]

export const DEFAULT_BRANCHES: Branch[] = []

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

          // 2. Fetch from backend API if available
          let apiList: Company[] = []
          const res: any = await api.get('/companies').catch(() => null)
          if (res && (Array.isArray(res.data) || Array.isArray(res))) {
            const list = Array.isArray(res.data) ? res.data : res
            apiList = list.map((c: any) => ({
              id: c.slug || String(c.id),
              name: c.name,
              brand_name: c.brand_name || c.name,
              division_name: c.division_name || '',
              subtitle: c.subtitle || '',
              slug: c.slug || String(c.id),
              logo: c.logo || (c.slug === 'digital' ? '📈' : '💻'),
              logo_url: c.logo_url || '/saampark-logo.png',
              currency: c.currency || 'INR',
              currency_symbol: c.currency_symbol || '₹',
            }))
          }

          const map = new Map<string, Company>()

          // 1. First add DEFAULT_COMPANIES as baseline
          DEFAULT_COMPANIES.forEach(c => {
            if (!isGlobalItemDeleted(c.id, deletedIds) && !isGlobalItemDeleted(c.slug || '', deletedIds)) {
              map.set(String(c.id).toLowerCase(), {
                ...c,
                name: getCompanyFullName(c),
              })
            }
          })

          // 2. Overlay API list
          apiList.forEach(c => {
            if (!isGlobalItemDeleted(c.id, deletedIds) && !isGlobalItemDeleted(c.slug || '', deletedIds)) {
              const key = String(c.slug || c.id).toLowerCase()
              const existing = map.get(key) || map.get(String(c.id).toLowerCase())
              map.set(key, {
                ...existing,
                ...c,
                brand_name: existing?.brand_name || c.brand_name || c.name,
                division_name: existing?.division_name !== undefined ? existing.division_name : (c.division_name || ''),
                subtitle: existing?.subtitle !== undefined ? existing.subtitle : (c.subtitle || ''),
                name: getCompanyFullName({ ...existing, ...c }),
              })
            }
          })

          // 3. Overlay DB module store (user created/updated companies)
          if (Array.isArray(dbCompanies) && dbCompanies.length > 0) {
            dbCompanies.forEach(c => {
              if (!isGlobalItemDeleted(c.id, deletedIds) && !isGlobalItemDeleted(c.slug || '', deletedIds)) {
                const key = String(c.slug || c.id).toLowerCase()
                const existing = map.get(key) || map.get(String(c.id).toLowerCase())
                map.set(key, {
                  ...existing,
                  ...c,
                  brand_name: c.brand_name || existing?.brand_name || 'SAAMPARK',
                  division_name: c.division_name !== undefined ? c.division_name : (existing?.division_name || ''),
                  subtitle: c.subtitle !== undefined ? c.subtitle : (existing?.subtitle || ''),
                  name: getCompanyFullName({ ...existing, ...c }),
                })
              }
            })
          }

          // 4. Also preserve any companies currently in state (so newly added or edited companies are never dropped)
          const currentStoreCompanies = get().companies || []
          currentStoreCompanies.forEach(c => {
            if (!isGlobalItemDeleted(c.id, deletedIds) && !isGlobalItemDeleted(c.slug || '', deletedIds)) {
              const key = String(c.slug || c.id).toLowerCase()
              const existing = map.get(key) || map.get(String(c.id).toLowerCase())
              map.set(key, {
                ...existing,
                ...c,
                brand_name: c.brand_name || existing?.brand_name || 'SAAMPARK',
                division_name: c.division_name !== undefined ? c.division_name : (existing?.division_name || ''),
                subtitle: c.subtitle !== undefined ? c.subtitle : (existing?.subtitle || ''),
                name: getCompanyFullName({ ...existing, ...c }),
              })
            }
          })

          const combined = Array.from(map.values()).map(c => ({
            ...c,
            name: getCompanyFullName(c),
          }))

          if (combined.length > 0) {
            set({ companies: combined })
            return combined
          }
        } catch (err) {
          console.warn("fetchCompanies warning:", err)
        }

        const currentFiltered = (get().companies && get().companies.length > 0) ? get().companies : DEFAULT_COMPANIES
        set({ companies: currentFiltered })
        return currentFiltered
      },

      fetchBranches: async () => {
        try {
          const deletedIds = await syncGlobalDeletedIds().catch(() => getLocalDeletedIds())
          const dbBranches = await fetchModuleDataFromDB<Branch[]>('branches', [], 'all').catch(() => null)
          
          let list: Branch[] = []
          if (Array.isArray(dbBranches) && dbBranches.length > 0) {
            list = dbBranches
          } else {
            const res: any = await api.get('/branches').catch(() => null)
            if (res && (Array.isArray(res.data) || Array.isArray(res))) {
              list = Array.isArray(res.data) ? res.data : res
            }
          }

          const filtered = list.filter(b => !isGlobalItemDeleted(b.id, deletedIds))
          set({ branches: filtered })
          return filtered
        } catch (err) {
          console.warn("fetchBranches warning:", err)
        }
        const localDeleted = getLocalDeletedIds()
        const currentFiltered = get().branches.filter(b => !isGlobalItemDeleted(b.id, localDeleted))
        set({ branches: currentFiltered })
        return currentFiltered
      },

      fetchSubBranches: async () => {
        try {
          const deletedIds = await syncGlobalDeletedIds().catch(() => getLocalDeletedIds())
          const dbSubBranches = await fetchModuleDataFromDB<SubBranch[]>('sub_branches', [], 'all').catch(() => null)
          
          let list: SubBranch[] = []
          if (Array.isArray(dbSubBranches) && dbSubBranches.length > 0) {
            list = dbSubBranches
          } else {
            const res: any = await api.get('/sub-branches').catch(() => null)
            if (res && (Array.isArray(res.data) || Array.isArray(res))) {
              list = Array.isArray(res.data) ? res.data : res
            }
          }

          const filtered = list.filter(sb => !isGlobalItemDeleted(sb.id, deletedIds))
          set({ subBranches: filtered })
          return filtered
        } catch (err) {
          console.warn("fetchSubBranches warning:", err)
        }
        const localDeleted = getLocalDeletedIds()
        const currentFiltered = (get().subBranches || []).filter(sb => !isGlobalItemDeleted(sb.id, localDeleted))
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
          name: updates.name || getCompanyFullName({ ...target, ...updates }),
        }

        // Try backend API update if available
        try {
          await api.put(`/companies/${target.id}`, {
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
        if (user?.role !== 'Super Admin') {
          throw new Error('Only Super Admin can delete companies.')
        }

        const compToDelete = companies.find(c => c.id === companyId || c.slug === companyId)
        const targetSlug = compToDelete?.slug || companyId

        // Mark deleted in universal tombstone registry
        markGlobalItemDeleted(companyId, 'companies')
        markGlobalItemDeleted(targetSlug, 'companies')

        try {
          await api.delete(`/companies/${companyId}`).catch(() => {})
        } catch {}

        const remainingCompanies = companies.filter(c => 
          c.id !== companyId && 
          c.slug !== companyId && 
          c.id !== targetSlug && 
          c.slug !== targetSlug
        )
        const remainingBranches = branches.filter(b => 
          b.companyId !== companyId && 
          b.companyId !== targetSlug &&
          b.companyId?.toLowerCase() !== companyId.toLowerCase() &&
          b.companyId?.toLowerCase() !== targetSlug.toLowerCase()
        )

        // Clean up deleted company from all users in the database
        try {
          const currentUsers = await fetchModuleDataFromDB<any[]>('users', [], 'all')
          if (Array.isArray(currentUsers)) {
            const updatedUsers = currentUsers.map((u: any) => {
              const uCompIds: string[] = Array.isArray(u.companyIds) ? u.companyIds : (u.companyId ? [u.companyId] : ['tech'])
              const cleanedIds = uCompIds.filter((id: string) => 
                id !== companyId && 
                id !== targetSlug && 
                id.toLowerCase() !== companyId.toLowerCase()
              )
              const fallbackId = remainingCompanies[0]?.id || remainingCompanies[0]?.slug || 'tech'
              const validIds = cleanedIds.length > 0 ? cleanedIds : [fallbackId]
              return {
                ...u,
                companyIds: validIds,
                companyId: validIds[0],
              }
            })
            await saveModuleDataToDB('users', updatedUsers, 'all')
          }
        } catch (e) {
          console.warn('Error cleaning up deleted company from users:', e)
        }

        let newActiveCompany = activeCompanyId
        if (activeCompanyId === companyId || activeCompanyId === targetSlug || activeCompanyId?.toLowerCase() === companyId.toLowerCase()) {
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
          code: branchData.code || `BR-${Math.floor(100 + Math.random() * 900)}`,
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
        const updated = branches.map(b => b.id === branchId ? { ...b, ...updates } : b)
        set({ branches: updated })
        await saveModuleDataToDB('branches', updated, 'all').catch(() => {})

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new CustomEvent('saampark_data_synced'))
        }
      },

      deleteBranch: async (branchId: string) => {
        const { branches } = get()
        try {
          await api.delete(`/branches/${branchId}`).catch(() => {})
        } catch {}

        markGlobalItemDeleted(branchId, 'branches')
        const updated = branches.filter(b => b.id !== branchId)
        set({ branches: updated })
        await saveModuleDataToDB('branches', updated, 'all').catch(() => {})

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
          await api.post('/sub-branches', newSubBranch).catch(() => {})
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
        const { subBranches } = get()
        try {
          await api.delete(`/sub-branches/${subBranchId}`).catch(() => {})
        } catch {}

        markGlobalItemDeleted(subBranchId, 'sub_branches')
        const updated = (subBranches || []).filter(sb => sb.id !== subBranchId)
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

        // If the user is assigned strictly to a single branch (e.g. Branch Admin / Branch Staff), lock them to their branch
        const isSingleBranchUser = Boolean(user.branchId && user.role !== 'Super Admin')
        if (isSingleBranchUser && branchId && String(branchId).toLowerCase().trim() !== String(user.branchId).toLowerCase().trim()) {
          return // Block switching to other branches
        }

        const canSwitch =
          user.role === 'Super Admin' ||
          (!user.branchId && user.role === 'Admin') ||
          !branchId ||
          user.branchId === branchId ||
          (user.branchIds && user.branchIds.includes(branchId))

        if (canSwitch) {
          invalidateModuleCache()
          set({ activeBranchId: isSingleBranchUser ? (user.branchId || null) : branchId })
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('saampark_branch_switched', { detail: isSingleBranchUser ? user.branchId : branchId }))
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

        const assignedCompanyIds = customUser?.companyIds || (normalizedRole === 'Super Admin' ? ['tech', 'digital'] : [customUser?.companyId || 'tech'])

        let parsedPerms: any = customUser?.permissions
        if (typeof parsedPerms === 'string') {
          try { parsedPerms = JSON.parse(parsedPerms) } catch {}
        }

        const userAllowedMods =
          customUser?.allowedModules ||
          (parsedPerms && Array.isArray(parsedPerms.allowedModules) ? parsedPerms.allowedModules : undefined)

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
          avatar: customUser?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${customUser?.email || normalizedRole}`,
          phone: customUser?.phone,
          allowedModules: normalizedRole === 'Super Admin' ? undefined : userAllowedMods,
          permissions: parsedPerms || customUser?.permissions,
        }

        const activeCompanyId = user.companyId || 'tech'

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('saampark_session_active', 'true')
          localStorage.setItem('saampark_last_activity_time', String(Date.now()))
        }

        set({
          isAuthenticated: true,
          user,
          activeCompanyId,
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

            const userObj: User = {
              id: res.user?.id || 'u_live',
              name: res.user?.full_name || res.user?.name || res.user?.email || 'User',
              email: res.user?.email || (normIdentifier.includes('@') ? normIdentifier : 'user@saampark.in'),
              username: res.user?.username || (!normIdentifier.includes('@') ? normIdentifier : undefined),
              role: role,
              companyId: res.user?.company_id || parsedCompanyIds[0] || 'tech',
              companyIds: parsedCompanyIds,
              branchId: userBranch,
              branchName: res.user?.branch_name || res.user?.branchName || undefined,
              avatar: res.user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${res.user?.email || 'user'}`,
              phone: res.user?.phone,
              allowedModules: userAllowedMods,
              permissions: resPerms || res.user?.permissions,
            }

            const initialBranchId = (role !== 'Super Admin' && userBranch) ? userBranch : null

            if (typeof window !== 'undefined') {
              sessionStorage.setItem('saampark_session_active', 'true')
              localStorage.setItem('saampark_last_activity_time', String(Date.now()))
            }

            set({
              isAuthenticated: true,
              token: res.token,
              user: userObj,
              activeCompanyId: userObj.companyId || 'tech',
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
        const matchedComp = companies.find(c => 
          String(c.id).toLowerCase().trim() === targetNorm || 
          String(c.slug || '').toLowerCase().trim() === targetNorm ||
          String(c.name || '').toLowerCase().trim() === targetNorm
        )
        const effectiveId = matchedComp?.id || companyId
        
        // Super Admin can switch to any company.
        // Admins, Teams, Clients can switch between any company they are assigned to.
        const isSuperAdmin = user.role === 'Super Admin'
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

          // Save updated user companyIds to persistence
          if (isSuperAdmin) {
            import('@/app/feature/users/services/userService').then(({ recordUserAccount }) => {
              recordUserAccount({
                ...updatedUser,
                id: String(updatedUser.id),
              })
            }).catch(() => {})
          }

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

