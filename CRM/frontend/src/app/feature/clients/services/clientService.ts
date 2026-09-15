"use client"

import { ClientItem, ContactItem, ClientLabelItem } from "../types"
import { api } from "@/lib/api"
import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"
import { markUserAsDeleted, recordUserAccount } from "@/app/feature/users/services/userService"
import { recordActivityLog } from "@/services/activityLogService"

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
    const filtered = filterGlobalDeletedItems(enriched, undefined, "clients")
    return filtered.sort((a, b) => getClientTimestamp(b) - getClientTimestamp(a))
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
  const list = filterGlobalDeletedItems(Array.from(map.values()), undefined, "clients")
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

  // Automated Activity Logging for Client Lifecycle
  if (existingClient) {
    recordActivityLog({
      type: "client",
      module: "Clients",
      action: "Client Profile Updated",
      description: `Client account "${enrichedClient.name}" details updated`,
      companyId: effectiveCompanyId,
      branchId: effectiveBranchId,
      branchName: effectiveBranchName,
      details: `Email: ${enrichedClient.email || "N/A"} | Phone: ${enrichedClient.phone || "N/A"}`
    }).catch(() => {})
  } else {
    recordActivityLog({
      type: "client",
      module: "Clients",
      action: "New Client Registered",
      description: `New client "${enrichedClient.name}" (${enrichedClient.primaryContact || "Primary Contact"}) registered`,
      companyId: effectiveCompanyId,
      branchId: effectiveBranchId,
      branchName: effectiveBranchName,
      details: `Group: ${enrichedClient.group || "Standard"} | Value: ${enrichedClient.totalInvoiced || "₹0"}`
    }).catch(() => {})
  }

  return updated
}

/** Delete a client and all associated invoices, projects, subscriptions, and records from MySQL */
export async function deleteStoredClient(id: string, email?: string, companyId?: string): Promise<ClientItem[]> {
  const normId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(normId, "clients")
  await markGlobalItemDeleted(normId, "users")

  if (email) {
    const normEmail = email.toLowerCase().trim()
    await markGlobalItemDeleted(normEmail, "clients")
    await markGlobalItemDeleted(normEmail, "users")
    markUserAsDeleted(normEmail)
  }

  // 1. Fetch current clients across all scopes to find full client details
  const allClients = await getClients("all")
  const target = allClients.find(c => String(c.id).toLowerCase().trim() === normId || (email && c.email?.toLowerCase().trim() === email.toLowerCase().trim()))
  const targetNameNorm = target?.name ? target.name.toLowerCase().trim() : ""
  const targetEmailNorm = (target?.email || email || "").toLowerCase().trim()

  if (targetNameNorm) {
    await markGlobalItemDeleted(targetNameNorm, "clients")
  }

  // 2. Remove client from all company keys in app_data
  const knownCompanies = ["all", "tech", "digital", "infotech", "fashion", "consultancy", "jewellers"]
  if (companyId && !knownCompanies.includes(companyId)) knownCompanies.push(companyId)

  await Promise.all(
    knownCompanies.map(async (c) => {
      try {
        const list = await fetchModuleDataFromDB<ClientItem[]>("clients", [], c)
        if (Array.isArray(list)) {
          const filtered = list.filter(
            (item) =>
              String(item.id).toLowerCase().trim() !== normId &&
              (!targetEmailNorm || (item.email || "").toLowerCase().trim() !== targetEmailNorm) &&
              (!targetNameNorm || (item.name || "").toLowerCase().trim() !== targetNameNorm)
          )
          if (filtered.length !== list.length) {
            await saveModuleDataToDB("clients", filtered, c)
          }
        }
      } catch {}
    })
  )

  // 3. Cascade delete associated Invoices
  try {
    const { getInvoices, deleteInvoice } = await import("@/app/feature/sales/invoices/services/invoiceService")
    const invoices = await getInvoices("all")
    const matchingInvoices = invoices.filter(i => {
      const invClient = (i.client || "").toLowerCase().trim()
      const invClientId = ((i as any).clientId || "").toLowerCase().trim()
      const invEmail = ((i as any).clientEmail || "").toLowerCase().trim()
      return (
        (targetNameNorm && invClient === targetNameNorm) ||
        (invClientId && invClientId === normId) ||
        (targetEmailNorm && invEmail === targetEmailNorm)
      )
    })
    for (const inv of matchingInvoices) {
      if (inv.id) await deleteInvoice(inv.id)
    }
  } catch (err) {
    console.warn("Cascade delete client invoices error:", err)
  }

  // 4. Cascade delete associated Projects
  try {
    const { getProjects, deleteProject } = await import("@/app/feature/projects/services/projectService")
    const projects = await getProjects()
    const matchingProjects = projects.filter(p => {
      const pClient = (p.client || "").toLowerCase().trim()
      const pClientId = ((p as any).clientId || "").toLowerCase().trim()
      return (
        (targetNameNorm && pClient === targetNameNorm) ||
        (pClientId && pClientId === normId)
      )
    })
    for (const proj of matchingProjects) {
      if (proj.id) await deleteProject(proj.id)
    }
  } catch (err) {
    console.warn("Cascade delete client projects error:", err)
  }

  // 5. Cascade delete associated Subscriptions
  try {
    const { getSubscriptions, deleteSubscription } = await import("@/app/feature/subscriptions/services/subscriptionService")
    const subs = await getSubscriptions("all")
    const matchingSubs = subs.filter(s => {
      const sClient = (s.clientName || "").toLowerCase().trim()
      const sClientId = ((s as any).clientId || "").toLowerCase().trim()
      const sEmail = ((s as any).clientEmail || "").toLowerCase().trim()
      return (
        (targetNameNorm && sClient === targetNameNorm) ||
        (sClientId && sClientId === normId) ||
        (targetEmailNorm && sEmail === targetEmailNorm)
      )
    })
    for (const sub of matchingSubs) {
      if (sub.id) await deleteSubscription(sub.id)
    }
  } catch (err) {
    console.warn("Cascade delete client subscriptions error:", err)
  }

  // 6. Cascade delete associated Payments
  try {
    const { getPayments, deletePayment } = await import("@/app/feature/sales/payments/services/paymentService")
    const payments = await getPayments("all")
    const matchingPayments = payments.filter(p => {
      const pClient = (p.client || "").toLowerCase().trim()
      const pClientId = ((p as any).clientId || "").toLowerCase().trim()
      return (
        (targetNameNorm && pClient === targetNameNorm) ||
        (pClientId && pClientId === normId)
      )
    })
    for (const pay of matchingPayments) {
      if (pay.id) await deletePayment(pay.id)
    }
  } catch (err) {
    console.warn("Cascade delete client payments error:", err)
  }

  // 7. Cascade delete client orders, estimates, tasks
  try {
    const orders = await fetchModuleDataFromDB<any[]>("orders", [], "all")
    const filteredOrders = orders.filter(o => {
      const oClient = (o.client || "").toLowerCase().trim()
      if (targetNameNorm && oClient === targetNameNorm) {
        if (o.id) markGlobalItemDeleted(o.id, "orders")
        return false
      }
      return true
    })
    if (filteredOrders.length !== orders.length) {
      await saveModuleDataToDB("orders", filteredOrders, "all")
    }
  } catch {}

  try {
    const estimates = await fetchModuleDataFromDB<any[]>("estimates", [], "all")
    const filteredEstimates = estimates.filter(e => {
      const eClient = (e.client || e.clientName || "").toLowerCase().trim()
      if (targetNameNorm && eClient === targetNameNorm) {
        if (e.id) markGlobalItemDeleted(e.id, "estimates")
        return false
      }
      return true
    })
    if (filteredEstimates.length !== estimates.length) {
      await saveModuleDataToDB("estimates", filteredEstimates, "all")
    }
  } catch {}

  try {
    const tasks = await fetchModuleDataFromDB<any[]>("tasks", [], "all")
    const filteredTasks = tasks.filter(t => {
      const tClient = (t.client || t.clientName || "").toLowerCase().trim()
      if (targetNameNorm && tClient === targetNameNorm) {
        if (t.id) markGlobalItemDeleted(t.id, "tasks")
        return false
      }
      return true
    })
    if (filteredTasks.length !== tasks.length) {
      await saveModuleDataToDB("tasks", filteredTasks, "all")
    }
  } catch {}

  // 8. Delete client contact and client portal user
  await deleteStoredContact(id, email)
  await deleteStoredContact(`cnt_${id}`, email)
  try {
    const { deleteUser } = await import("@/app/feature/users/services/userService")
    await deleteUser(`usr_cli_${id}`, targetEmailNorm)
    if (targetEmailNorm) {
      await deleteUser(targetEmailNorm, targetEmailNorm)
    }
  } catch {}

  recordActivityLog({
    type: "client",
    module: "Clients",
    action: "Client Account Deleted",
    description: `Client account "${target?.name || id}" and all associated invoices, projects, and records removed`,
    companyId: target?.companyId || companyId,
    branchId: target?.branchId,
    branchName: target?.branchName,
    details: `Client ID: ${id} | Email: ${email || "N/A"}`
  }).catch(() => {})

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }

  return allClients.filter(
    (c) =>
      String(c.id).toLowerCase().trim() !== normId &&
      (!targetEmailNorm || (c.email || "").toLowerCase().trim() !== targetEmailNorm) &&
      (!targetNameNorm || (c.name || "").toLowerCase().trim() !== targetNameNorm)
  )
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




