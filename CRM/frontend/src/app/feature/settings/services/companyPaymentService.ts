import { fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"

export interface BankDetailsProfile {
  qrCodeUrl?: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  upiId: string
  branch?: string
  swiftCode?: string
  notes?: string
}

export interface CompanyPaymentSettings {
  // Legacy / Fallback single profile
  qrCodeUrl?: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  upiId: string
  branch?: string
  swiftCode?: string
  notes?: string

  // Dual Profiles: GST vs Non-GST
  gstProfile?: BankDetailsProfile
  nongstProfile?: BankDetailsProfile
}

export const DEFAULT_BANK_PROFILE: BankDetailsProfile = {
  qrCodeUrl: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  upiId: "",
  branch: "",
  swiftCode: "",
  notes: "",
}

export const DEFAULT_COMPANY_PAYMENT_SETTINGS: CompanyPaymentSettings = {
  qrCodeUrl: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  upiId: "",
  branch: "",
  swiftCode: "",
  notes: "",
  gstProfile: { ...DEFAULT_BANK_PROFILE },
  nongstProfile: { ...DEFAULT_BANK_PROFILE },
}

export async function getCompanyPaymentSettings(companyId?: string): Promise<CompanyPaymentSettings> {
  const data = await fetchModuleDataFromDB<CompanyPaymentSettings>(
    "company_payment_settings",
    DEFAULT_COMPANY_PAYMENT_SETTINGS,
    companyId
  )
  if (data && typeof data === "object") {
    return { ...DEFAULT_COMPANY_PAYMENT_SETTINGS, ...data }
  }
  return DEFAULT_COMPANY_PAYMENT_SETTINGS
}

export async function saveCompanyPaymentSettings(
  settings: CompanyPaymentSettings,
  companyId?: string
): Promise<CompanyPaymentSettings> {
  await saveModuleDataToDB("company_payment_settings", settings, companyId)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saampark_payment_settings_updated"))
  }
  return settings
}
