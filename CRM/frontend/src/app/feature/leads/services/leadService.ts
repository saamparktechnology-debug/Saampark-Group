import { Lead } from "../types"

const LEAD_DATA: Record<string, Lead[]> = {
  tech: [
    { id: "L-1", name: "Rice-Wolf Industries", primaryContact: "Luciano Schaefer", phone: "+91 97800 34460", owner: "Sara Ann", value: "₹4,20,000", createdAt: "31-07-2026", status: "Lost" },
    { id: "L-2", name: "Casper-Altenwerth", primaryContact: "Reid Wisoky", phone: "+91 98700 15780", owner: "John Doe", value: "₹1,20,000", createdAt: "30-07-2026", status: "New" },
    { id: "L-3", name: "Schaefer & Associates", primaryContact: "Shaylee Lockman", phone: "+91 98000 49763", owner: "Richard Gray", value: "₹8,50,000", createdAt: "30-07-2026", status: "Negotiation" },
    { id: "L-4", name: "Sandra Waters Ltd", primaryContact: "Sandra Waters", phone: "+91 94600 72884", owner: "Richard Gray", value: "₹2,80,000", createdAt: "30-07-2026", status: "Negotiation" },
    { id: "L-5", name: "Abshire-Armstrong Co", primaryContact: "Sterling Kertzmann", phone: "+91 97400 10851", owner: "Sara Ann", value: "₹15,00,000", createdAt: "29-07-2026", status: "Discussion" },
    { id: "L-6", name: "Thiel, Batz and Homenick", primaryContact: "Maci Adams", phone: "+91 94600 81393", owner: "John Doe", value: "₹6,30,000", createdAt: "29-07-2026", status: "Qualified" },
  ],
  digital: [
    { id: "LD-1", name: "Acme Retail Store", primaryContact: "Bob Builder", phone: "+91 98765 43210", owner: "Jane Smith", value: "₹1,50,000", createdAt: "01-08-2026", status: "New" },
    { id: "LD-2", name: "Local Cafe Chain", primaryContact: "Alice Cafe", phone: "+91 87654 32109", owner: "Jane Smith", value: "₹75,000", createdAt: "31-07-2026", status: "Discussion" },
    { id: "LD-3", name: "Fitness Gym", primaryContact: "Mike Strong", phone: "+91 76543 21098", owner: "John Doe", value: "₹3,00,000", createdAt: "30-07-2026", status: "Qualified" },
    { id: "LD-4", name: "Online Bookstore", primaryContact: "Read Books", phone: "+91 65432 10987", owner: "Sara Ann", value: "₹2,10,000", createdAt: "29-07-2026", status: "Won" },
  ]
}

export const statusColors: Record<string, string> = {
  New: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Discussion: "bg-info/10 text-info border-info/20",
  Negotiation: "bg-warning/10 text-warning border-warning/20",
  Qualified: "bg-success/10 text-success border-success/20",
  Won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Lost: "bg-danger/10 text-danger border-danger/20",
}

export const getLeads = async (companyId: string): Promise<Lead[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(LEAD_DATA[companyId === "digital" ? "digital" : "tech"] || [])
    }, 100)
  })
}
