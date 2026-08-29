"use client"

import { ClientItem, ContactItem, ClientLabelItem } from "../types"
import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"
import { markUserAsDeleted, recordUserAccount } from "@/app/feature/users/services/userService"

// ── Default client labels seeded to DB ─────────────────────────────────────
const DEFAULT_CLIENT_LABELS: ClientLabelItem[] = [
  { id: "clbl_1", name: "50% Probability", color: "#eab308" },
  { id: "clbl_2", name: "90% Probability", color: "#84cc16" },
  { id: "clbl_3", name: "Call this week", color: "#c026d3" },
  { id: "clbl_4", name: "Corporate", color: "#d8b4fe" },
  { id: "clbl_5", name: "Inactive", color: "#94a3b8" },
  { id: "clbl_6", name: "Potential", color: "#3b82f6" },
  { id: "clbl_7", name: "Referral", color: "#2dd4bf" },
  { id: "clbl_8", name: "Satisfied", color: "#65a30d" },
  { id: "clbl_9", name: "Unsatisfied", color: "#38bdf8" },
]

export function getClientTimestamp(c: ClientItem): number {
  if (typeof c.createdAt === "number") return c.createdAt
  if (typeof c.createdAt === "string" && !isNaN(Number(c.createdAt))) return Number(c.createdAt)
  if (typeof c.createdAt === "string" && !isNaN(Date.parse(c.createdAt))) return Date.parse(c.createdAt)
  const match = (c.id || "").match(/(\d{10,14})/)
  if (match) return Number(match[1])
  return 0
}

// ── Clients ─────────────────────────────────────────────────────────────────

/** Fetch all clients from MySQL */
export async function getClients(companyId?: string): Promise<ClientItem[]> {
  const data = await fetchModuleDataFromDB<ClientItem[]>("clients", [], companyId)
  const list = filterGlobalDeletedItems<ClientItem>(Array.isArray(data) ? data : [])
  return list.sort((a, b) => getClientTimestamp(b) - getClientTimestamp(a))
}

/** @deprecated Use getClients() instead (async) */
export function getStoredClients(): ClientItem[] {
  console.warn("[clientService] getStoredClients() is deprecated — use getClients() (async).")
  return []
}

/** Save (add or update) a client to MySQL */
export async function saveStoredClient(client: ClientItem, companyId?: string): Promise<ClientItem[]> {
  let activeBranch: string | undefined = undefined
  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      activeBranch = useAuthStore.getState().activeBranchId || useAuthStore.getState().user?.branchId || undefined
    } catch {}
  }

  const enrichedClient: ClientItem = {
    ...client,
    branchId: (client as any).branchId || activeBranch || undefined,
    createdAt: client.createdAt || Date.now(),
  }

  const current = await getClients(companyId)
  const updated = [
    enrichedClient,
    ...current.filter(
      (c) =>
        c.id !== enrichedClient.id &&
        c.email?.toLowerCase().trim() !== enrichedClient.email?.toLowerCase().trim()
    ),
  ]
  await saveModuleDataToDB("clients", updated, companyId)

  const clientEmailNorm = (
    enrichedClient.email ||
    `${enrichedClient.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@saampark-client.com`
  ).toLowerCase().trim()

  // Sync contact entry for this client
  await saveStoredContact(
    {
      id: `cnt_${enrichedClient.id}`,
      name: enrichedClient.primaryContact || enrichedClient.name,
      clientName: enrichedClient.name,
      jobTitle: "Primary Contact",
      email: enrichedClient.email ? enrichedClient.email.trim() : "",
      phone: enrichedClient.phone || "N/A",
      avatarSeed: enrichedClient.primaryContact || enrichedClient.name,
    },
    companyId
  )

  // Automatically register client user account for login
  try {
    recordUserAccount(
      {
        id: `usr_cli_${enrichedClient.id}`,
        name: enrichedClient.primaryContact || enrichedClient.name,
        email: clientEmailNorm,
        role: "Clients",
        companyId: companyId || "tech",
        companyName: enrichedClient.name,
        phone: enrichedClient.phone || "",
        password: "Password123",
        status: "Active",
        department: "Clients",
      },
      true
    )
  } catch (uErr) {
    console.warn("Client user sync error:", uErr)
  }

  return updated
}

/** Delete a client from MySQL */
export async function deleteStoredClient(id: string, email?: string, companyId?: string): Promise<ClientItem[]> {
  await markGlobalItemDeleted(id, "clients")
  await markGlobalItemDeleted(id, "users")

  if (email) {
    const normEmail = email.toLowerCase().trim()
    await markGlobalItemDeleted(normEmail, "clients")
    await markGlobalItemDeleted(normEmail, "users")
    markUserAsDeleted(normEmail)
  }

  const current = await getClients(companyId)
  const updated = current.filter(
    (c) => c.id !== id && (!email || c.email?.toLowerCase().trim() !== email.toLowerCase().trim())
  )
  await saveModuleDataToDB("clients", updated, companyId)
  return updated
}

// ── Contacts ─────────────────────────────────────────────────────────────────

/** Fetch all contacts from MySQL */
export async function getStoredContacts(companyId?: string): Promise<ContactItem[]> {
  const data = await fetchModuleDataFromDB<ContactItem[]>("contacts", [], companyId)
  return filterGlobalDeletedItems(Array.isArray(data) ? data : [])
}

/** Save a contact to MySQL */
export async function saveStoredContact(contact: ContactItem, companyId?: string): Promise<ContactItem[]> {
  const current = await getStoredContacts(companyId)
  const updated = [contact, ...current.filter((c) => c.id !== contact.id)]
  await saveModuleDataToDB("contacts", updated, companyId)
  return updated
}

/** Delete a contact from MySQL */
export async function deleteStoredContact(id: string, email?: string, companyId?: string): Promise<ContactItem[]> {
  await markGlobalItemDeleted(id, "contacts")
  if (email) await markGlobalItemDeleted(email.toLowerCase().trim(), "contacts")

  const current = await getStoredContacts(companyId)
  const updated = current.filter(
    (c) =>
      c.id !== id &&
      c.id !== `cnt_${id}` &&
      (!email || c.email?.toLowerCase().trim() !== email.toLowerCase().trim())
  )
  await saveModuleDataToDB("contacts", updated, companyId)
  return updated
}

// ── Client Labels ─────────────────────────────────────────────────────────────

/** Fetch client labels from MySQL, seeding defaults if none exist */
export async function getStoredClientLabels(companyId?: string): Promise<ClientLabelItem[]> {
  const data = await fetchModuleDataFromDB<ClientLabelItem[]>("client_labels", DEFAULT_CLIENT_LABELS, companyId)
  if (!Array.isArray(data) || data.length === 0) {
    await saveModuleDataToDB("client_labels", DEFAULT_CLIENT_LABELS, companyId)
    return DEFAULT_CLIENT_LABELS
  }
  return data
}

/** Add a client label to MySQL */
export async function saveStoredClientLabel(label: ClientLabelItem, companyId?: string): Promise<ClientLabelItem[]> {
  const current = await getStoredClientLabels(companyId)
  const updated = [...current.filter((l) => l.id !== label.id), label]
  await saveModuleDataToDB("client_labels", updated, companyId)
  return updated
}

/** Delete a client label from MySQL */
export async function deleteStoredClientLabel(id: string, companyId?: string): Promise<ClientLabelItem[]> {
  const current = await getStoredClientLabels(companyId)
  const updated = current.filter((l) => l.id !== id)
  await saveModuleDataToDB("client_labels", updated, companyId)
  return updated
}

/** Format display email to hide background dummy/placeholder identifiers (e.g. lead_123@..., client@saampark-client.com) */
export function formatDisplayEmail(email?: string): string {
  if (!email) return ""
  const clean = email.trim()
  const lower = clean.toLowerCase()
  if (
    lower.startsWith("lead_") ||
    lower.includes("@crm.saampark") ||
    lower.includes("@saampark-client.com") ||
    (lower.startsWith("lead_") && (lower.endsWith("@saampark.in") || lower.endsWith("@saampark.com"))) ||
    lower.includes("lead_lead_") ||
    lower.includes("@crm.local") ||
    lower.includes("@saampark.internal") ||
    lower.includes("dummy") ||
    lower.includes("placeholder") ||
    lower.endsWith("@example.com")
  ) {
    return ""
  }
  return clean
}




