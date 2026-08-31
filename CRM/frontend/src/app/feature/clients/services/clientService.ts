"use client"

import { ClientItem, ContactItem, ClientLabelItem } from "../types"
import { api } from "@/lib/api"
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

/** Fetch all clients from MySQL for the given company scope */
export async function getClients(companyId?: string): Promise<ClientItem[]> {
  // When a specific company is requested, fetch only that scope
  // (avoid cross-company data leakage by NOT merging other company scopes)
  const scopeId = companyId || "all"
  
  if (scopeId !== "all") {
    const data = await fetchModuleDataFromDB<ClientItem[]>("clients", [], scopeId).catch(() => [])
    const enriched = (Array.isArray(data) ? data : []).map(c => ({
      ...c,
      companyId: c.companyId || scopeId,
    }))
    return enriched.sort((a, b) => getClientTimestamp(b) - getClientTimestamp(a))
  }

  // For "all" scope (Super Admin): merge across all company scopes
  const [dbData, techData] = await Promise.all([
    fetchModuleDataFromDB<ClientItem[]>("clients", [], "all").catch(() => []),
    fetchModuleDataFromDB<ClientItem[]>("clients", [], "tech").catch(() => [])
  ])
  const map = new Map<string, ClientItem>()
  for (const c of (Array.isArray(dbData) ? dbData : [])) {
    if (c && c.id) map.set(String(c.id).toLowerCase().trim(), c)
  }
  for (const c of (Array.isArray(techData) ? techData : [])) {
    if (c && c.id) map.set(String(c.id).toLowerCase().trim(), c)
  }
  const list = Array.from(map.values())
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
  let activeCompany: string | undefined = undefined
  let foundCompanyName: string | undefined = undefined
  let foundBranchName: string | undefined = undefined
  let foundBranchCode: string | undefined = undefined

  if (typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      const authState = useAuthStore.getState()
      activeBranch = authState.activeBranchId || authState.user?.branchId || undefined
      activeCompany = authState.activeCompanyId || authState.user?.companyId || "tech"
      const compIdToLookup = companyId || client.companyId || activeCompany
      const compObj = authState.companies.find((c: any) => c.id?.toLowerCase() === compIdToLookup?.toLowerCase())
      if (compObj) {
        foundCompanyName = compObj.brand_name || compObj.name
      }
      const branchIdToLookup = client.branchId || activeBranch
      if (branchIdToLookup) {
        const brObj = authState.branches.find((b: any) => b.id === branchIdToLookup || b.name.toLowerCase() === branchIdToLookup.toLowerCase())
        if (brObj) {
          foundBranchName = brObj.name
          foundBranchCode = brObj.code ? brObj.code.toUpperCase() : undefined
        }
      }
    } catch {}
  }

  const effectiveCompanyId = companyId || client.companyId || activeCompany || "tech"
  const effectiveCompanyName = client.companyName || foundCompanyName || (effectiveCompanyId === "print" ? "Print Space India" : "SAAMPARK Technology")
  const effectiveBranchId = client.branchId || activeBranch || undefined
  const effectiveBranchName = client.branchName || foundBranchName || undefined
  const effectiveBranchCode = client.branchCode || foundBranchCode || undefined

  const enrichedClient: ClientItem = {
    ...client,
    companyId: effectiveCompanyId,
    companyName: effectiveCompanyName,
    branchId: effectiveBranchId,
    branchName: effectiveBranchName,
    branchCode: effectiveBranchCode,
    createdAt: client.createdAt || Date.now(),
  }

  const allClients = await getClients("all")
  const existingClient = allClients.find(
    (c) =>
      c.id === client.id ||
      (client.email && c.email && c.email.toLowerCase().trim() === client.email.toLowerCase().trim())
  )
  const oldCompanyId = (existingClient?.companyId || "").toLowerCase().trim()
  const newCompanyId = effectiveCompanyId.toLowerCase().trim()

  // If transferred to a different company, remove from old company
  if (oldCompanyId && oldCompanyId !== newCompanyId && oldCompanyId !== "all") {
    const oldList = await getClients(oldCompanyId)
    const filteredOld = oldList.filter(
      (c) =>
        c.id !== enrichedClient.id &&
        c.email?.toLowerCase().trim() !== enrichedClient.email?.toLowerCase().trim()
    )
    await saveModuleDataToDB("clients", filteredOld, oldCompanyId)
  }

  const current = await getClients(effectiveCompanyId)
  const updated = [
    enrichedClient,
    ...current.filter(
      (c) =>
        c.id !== enrichedClient.id &&
        c.email?.toLowerCase().trim() !== enrichedClient.email?.toLowerCase().trim()
    ),
  ]
  await saveModuleDataToDB("clients", updated, effectiveCompanyId)
  if (effectiveCompanyId !== "all") {
    const updatedAll = [
      enrichedClient,
      ...allClients.filter(
        (c) =>
          c.id !== enrichedClient.id &&
          c.email?.toLowerCase().trim() !== enrichedClient.email?.toLowerCase().trim()
      ),
    ]
    await saveModuleDataToDB("clients", updatedAll, "all")
  }

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
    effectiveCompanyId
  )

  // Automatically register client user account for login
  try {
    recordUserAccount(
      {
        id: `usr_cli_${enrichedClient.id}`,
        name: enrichedClient.primaryContact || enrichedClient.name,
        email: clientEmailNorm,
        role: "Clients",
        companyId: effectiveCompanyId,
        companyIds: [effectiveCompanyId],
        companyName: effectiveCompanyName,
        branchId: effectiveBranchId,
        branchName: effectiveBranchName,
        phone: enrichedClient.phone || "",
        password: "Password123",
        status: "Active",
        department: "Clients",
      },
      true
    )

    if (enrichedClient.email && !enrichedClient.email.includes("@saampark-client.com")) {
      api.post("/users", {
        full_name: enrichedClient.primaryContact || enrichedClient.name,
        email: clientEmailNorm,
        password: "Password123",
        role_id: 4,
        role: "Clients",
        company_id: effectiveCompanyId,
        company_ids: [effectiveCompanyId],
        companyName: effectiveCompanyName,
        branch_id: effectiveBranchId,
        department: "Clients",
        phone: enrichedClient.phone || "",
      }).catch((err) => console.warn("Backend user create warning for client:", err))
    }
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




