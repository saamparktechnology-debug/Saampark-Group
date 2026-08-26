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
  bankName: "State Bank of India",
  accountHolderName: "Saampark Technology & Research Pvt. Ltd.",
  accountNumber: "40912384759",
  ifscCode: "SBIN0001234",
  upiId: "saampark@sbi",
  branch: "Balichak Station Road",
  swiftCode: "SBININBB123",
  notes: "Please scan QR or transfer via NEFT/RTGS/IMPS. Mention Invoice ID in transaction note.",
}

export async function getCompanyPaymentSettings(companyId?: string): Promise<CompanyPaymentSettings> {
  const data = await fetchModuleDataFromDB<CompanyPaymentSettings>(
    "company_payment_settings",
    DEFAULT_COMPANY_PAYMENT_SETTINGS,
    companyId
  )
  if (data && typeof data === "object" && data.bankName) {
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
