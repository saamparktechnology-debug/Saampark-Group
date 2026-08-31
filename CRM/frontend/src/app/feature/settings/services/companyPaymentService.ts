import { fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"

export interface CompanyPaymentSettings {
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
