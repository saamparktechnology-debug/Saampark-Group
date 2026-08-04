import { Subscription } from "../types"

const SUBSCRIPTION_DATA: Record<string, Subscription[]> = {
  tech: [
    { id: "SUB-001", clientName: "Acme Corp", planName: "Enterprise IT Support", status: "Active", amount: "₹50,000", billingCycle: "Monthly", nextBillingDate: "15-08-2026" },
    { id: "SUB-002", clientName: "TechNova Solutions", planName: "Cloud Hosting Pro", status: "Active", amount: "₹15,000", billingCycle: "Monthly", nextBillingDate: "20-08-2026" },
    { id: "SUB-003", clientName: "Wayne Tech", planName: "Security Audit Annual", status: "Past Due", amount: "₹5,00,000", billingCycle: "Annually", nextBillingDate: "01-08-2026" },
    { id: "SUB-004", clientName: "Stark Enterprises", planName: "AI Infrastructure", status: "Trial", amount: "₹0", billingCycle: "Monthly", nextBillingDate: "05-09-2026" },
  ],
  digital: [
    { id: "SUB-D1", clientName: "GrowthPulse Marketing", planName: "SEO Retainer", status: "Active", amount: "₹25,000", billingCycle: "Monthly", nextBillingDate: "10-08-2026" },
    { id: "SUB-D2", clientName: "Apex Creatives", planName: "Social Media Management", status: "Active", amount: "₹35,000", billingCycle: "Monthly", nextBillingDate: "12-08-2026" },
    { id: "SUB-D3", clientName: "Zenith Digital", planName: "Content Writing Plus", status: "Canceled", amount: "₹10,000", billingCycle: "Monthly", nextBillingDate: "-" },
  ]
}

export const getSubscriptions = async (companyId: string): Promise<Subscription[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(SUBSCRIPTION_DATA[companyId === "digital" ? "digital" : "tech"] || [])
    }, 100)
  })
}
