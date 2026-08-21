import { fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"

export type InvoiceStatus = "Draft" | "Partially paid" | "Fully paid" | "Not paid" | "Credited" | "Payment Pending"

export interface InvoiceItem {
  id: string
  client: string
  clientEmail?: string
  project: string
  billDate: string
  dueDate: string
  baseAmount?: number
  gstRate?: number
  gstAmount?: number
  totalInvoiced: string
  paymentReceived: string
  due: string
  status: InvoiceStatus
  billedBy?: string
}

export const INITIAL_INVOICES: InvoiceItem[] = [
  { id: "INV #28", client: "Acme Corp", project: "Product Photography and Cataloging", billDate: "01-08-2026", dueDate: "-", totalInvoiced: "₹30,000", paymentReceived: "₹0", due: "₹0", status: "Draft" },
  { id: "INV #27", client: "Stark Enterprises", project: "Social Media Marketing Campaign", billDate: "27-07-2026", dueDate: "10-08-2026", totalInvoiced: "₹12,000", paymentReceived: "₹0", due: "₹12,000", status: "Draft" },
  { id: "INV #24", client: "Wayne Tech", project: "Event Planning and Management", billDate: "01-08-2026", dueDate: "14-08-2026", totalInvoiced: "₹13,500", paymentReceived: "₹6,750", due: "₹6,750", status: "Partially paid" },
  { id: "INV #23", client: "TechNova Solutions", project: "Podcast Production and Editing", billDate: "26-07-2026", dueDate: "09-08-2026", totalInvoiced: "₹9,000", paymentReceived: "₹9,000", due: "₹0", status: "Fully paid" },
  { id: "INV #22", client: "Global Industries", project: "SEO Optimization Strategy", billDate: "23-07-2026", dueDate: "06-08-2026", totalInvoiced: "₹36,000", paymentReceived: "₹36,000", due: "₹0", status: "Fully paid" },
  { id: "INV #21", client: "Acme Corp", project: "Product Photography and Cataloging", billDate: "25-07-2026", dueDate: "06-08-2026", totalInvoiced: "₹50,000", paymentReceived: "₹50,000", due: "₹0", status: "Credited" },
  { id: "INV #19", client: "Patel & Associates", project: "E-commerce Website Design", billDate: "24-07-2026", dueDate: "05-08-2026", totalInvoiced: "₹9,000", paymentReceived: "₹0", due: "₹9,000", status: "Not paid" },
]

export const getInvoices = async (): Promise<InvoiceItem[]> => {
  const data = await fetchModuleDataFromDB<InvoiceItem[]>("invoices", INITIAL_INVOICES)
  return Array.isArray(data) && data.length > 0 ? data : INITIAL_INVOICES
}

export const addInvoice = async (invoice: Omit<InvoiceItem, "id"> & { id?: string }): Promise<InvoiceItem> => {
  const current = await getInvoices()
  const nextId = invoice.id || `INV #${Math.floor(100 + Math.random() * 900)}`
  const newInvoice: InvoiceItem = { ...invoice, id: nextId }
  const updated = [newInvoice, ...current]
  await saveModuleDataToDB("invoices", updated)
  return newInvoice
}

export const updateInvoiceStatus = async (id: string, status: InvoiceStatus, paymentReceived?: string): Promise<InvoiceItem | null> => {
  const current = await getInvoices()
  const idx = current.findIndex((i) => i.id === id)
  if (idx === -1) return null
  const target = current[idx]
  current[idx] = {
    ...target,
    status,
    paymentReceived: paymentReceived !== undefined ? paymentReceived : (status === "Fully paid" ? target.totalInvoiced : target.paymentReceived),
    due: status === "Fully paid" ? "₹0" : target.due,
  }
  await saveModuleDataToDB("invoices", current)
  return current[idx]
}
