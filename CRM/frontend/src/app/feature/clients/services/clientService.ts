import { Client } from "../types"

const CLIENT_DATA: Record<string, Client[]> = {
  tech: [
    { id: "CLI-001", name: "Acme Corp", email: "contact@acmecorp.com", status: "Active", projects: 4, amount: "₹35,00,000" },
    { id: "CLI-002", name: "TechNova Solutions", email: "hello@technova.io", status: "Active", projects: 2, amount: "₹12,80,000" },
    { id: "CLI-003", name: "Global Industries", email: "info@globalind.com", status: "Inactive", projects: 0, amount: "₹0" },
    { id: "CLI-004", name: "Stark Enterprises", email: "tony@stark.com", status: "Lead", projects: 1, amount: "₹1,04,00,000" },
    { id: "CLI-005", name: "Wayne Tech", email: "bruce@wayne.com", status: "Active", projects: 5, amount: "₹74,00,000" },
    { id: "CLI-006", name: "Patel & Associates", email: "info@patel.in", status: "Active", projects: 3, amount: "₹28,50,000" },
  ],
  digital: [
    { id: "CLI-D1", name: "GrowthPulse Marketing", email: "growth@pulse.in", status: "Active", projects: 6, amount: "₹18,50,000" },
    { id: "CLI-D2", name: "Apex Creatives", email: "design@apex.com", status: "Active", projects: 3, amount: "₹8,40,000" },
    { id: "CLI-D3", name: "HyperScale Ventures", email: "venture@hyperscale.io", status: "Lead", projects: 1, amount: "₹4,20,000" },
    { id: "CLI-D4", name: "Zenith Digital", email: "hello@zenith.in", status: "Inactive", projects: 0, amount: "₹0" },
  ]
}

export const getClients = async (companyId: string): Promise<Client[]> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(CLIENT_DATA[companyId === "digital" ? "digital" : "tech"] || [])
    }, 100)
  })
}
