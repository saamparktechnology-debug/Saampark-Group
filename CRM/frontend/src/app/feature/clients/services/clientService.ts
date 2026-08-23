"use client"

import { ClientItem, ContactItem, ClientLabelItem } from "../types"
import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"
import { markUserAsDeleted, recordUserAccount } from "@/app/feature/users/services/userService"

const CLIENTS_STORAGE_KEY = "saampark_stored_clients"
const CONTACTS_STORAGE_KEY = "saampark_stored_contacts"
const CLIENT_LABELS_STORAGE_KEY = "saampark_stored_client_labels"

export function getClientTimestamp(c: ClientItem): number {
  if (typeof c.createdAt === "number") return c.createdAt
  if (typeof c.createdAt === "string" && !isNaN(Number(c.createdAt))) return Number(c.createdAt)
  if (typeof c.createdAt === "string" && !isNaN(Date.parse(c.createdAt))) return Date.parse(c.createdAt)
  const match = (c.id || "").match(/(\d{10,14})/)
  if (match) return Number(match[1])
  return 0
}

export function getStoredClients(): ClientItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY)
    const local = raw ? JSON.parse(raw) : []
    fetchModuleDataFromDB<ClientItem[]>("clients", local).then(dbData => {
      if (Array.isArray(dbData) && dbData.length > 0 && typeof window !== "undefined") {
        try { localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(dbData)) } catch {}
      }
    }).catch(() => {})
    const filtered = filterGlobalDeletedItems<ClientItem>(local)
    return filtered.sort((a, b) => getClientTimestamp(b) - getClientTimestamp(a))
  } catch (err) {
    console.error("Error reading stored clients:", err)
    return []
  }
}

export function saveStoredClient(client: ClientItem): ClientItem[] {
  if (typeof window === "undefined") return []
  try {
    const enrichedClient: ClientItem = {
      ...client,
      createdAt: client.createdAt || Date.now(),
    }
    const current = getStoredClients()
    const updated = [enrichedClient, ...current.filter((c) => c.id !== enrichedClient.id && c.email?.toLowerCase().trim() !== enrichedClient.email?.toLowerCase().trim())]
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated))
    saveModuleDataToDB("clients", updated)

    const clientEmailNorm = (enrichedClient.email || `${enrichedClient.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@saampark-client.com`).toLowerCase().trim()

    // Automatically sync contact entry for this client
    saveStoredContact({
      id: `cnt_${enrichedClient.id}`,
      name: enrichedClient.primaryContact || enrichedClient.name,
      clientName: enrichedClient.name,
      jobTitle: "Primary Contact",
      email: clientEmailNorm,
      phone: enrichedClient.phone || "N/A",
      avatarSeed: enrichedClient.primaryContact || enrichedClient.name,
    })

    // Automatically record client user account for login and Users directory
    try {
      recordUserAccount({
        id: `usr_cli_${enrichedClient.id}`,
        name: enrichedClient.primaryContact || enrichedClient.name,
        email: clientEmailNorm,
        role: "Clients",
        companyId: "tech",
        companyName: enrichedClient.name,
        phone: enrichedClient.phone || "",
        password: "Password123",
        status: "Active",
        department: "Clients",
      }, true)
    } catch (uErr) {
      console.warn("Client user sync error:", uErr)
    }

    return updated
  } catch (err) {
    console.error("Error saving client:", err)
    return []
  }
}

export function deleteStoredClient(id: string, email?: string): ClientItem[] {
  if (typeof window === "undefined") return []
  try {
    markGlobalItemDeleted(id, "clients")
    markGlobalItemDeleted(id, "users")

    if (email) {
      const normEmail = email.toLowerCase().trim()
      markGlobalItemDeleted(normEmail, "clients")
      markGlobalItemDeleted(normEmail, "users")
      markUserAsDeleted(normEmail)
    }

    // Remove from local storage accounts
    const accountsRaw = localStorage.getItem("saampark_registered_accounts")
    if (accountsRaw) {
      try {
        const parsed: any[] = JSON.parse(accountsRaw)
        const updatedAccounts = parsed.filter(a => a.id !== id && (!email || a.email?.toLowerCase().trim() !== email.toLowerCase().trim()))
        localStorage.setItem("saampark_registered_accounts", JSON.stringify(updatedAccounts))
      } catch {}
    }

    const current = getStoredClients()
    const updated = current.filter((c) => c.id !== id && (!email || c.email?.toLowerCase().trim() !== email.toLowerCase().trim()))
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated))
    saveModuleDataToDB("clients", updated)
    return updated
  } catch (err) {
    console.error("Error deleting client:", err)
    return []
  }
}

export function getStoredContacts(): ContactItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY)
    if (!raw) return []
    return filterGlobalDeletedItems(JSON.parse(raw))
  } catch (err) {
    console.error("Error reading stored contacts:", err)
    return []
  }
}

export function saveStoredContact(contact: ContactItem): ContactItem[] {
  if (typeof window === "undefined") return []
  try {
    const current = getStoredContacts()
    const updated = [contact, ...current.filter((c) => c.id !== contact.id)]
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Error saving contact:", err)
    return []
  }
}

export function deleteStoredContact(id: string, email?: string): ContactItem[] {
  if (typeof window === "undefined") return []
  try {
    markGlobalItemDeleted(id, "contacts")
    if (email) {
      markGlobalItemDeleted(email.toLowerCase().trim(), "contacts")
    }

    const current = getStoredContacts()
    const updated = current.filter((c) => c.id !== id && c.id !== `cnt_${id}` && (!email || c.email?.toLowerCase().trim() !== email.toLowerCase().trim()))
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Error deleting contact:", err)
    return []
  }
}

export function getStoredClientLabels(): ClientLabelItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CLIENT_LABELS_STORAGE_KEY)
    if (!raw) {
      const defaultLabels: ClientLabelItem[] = [
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
      localStorage.setItem(CLIENT_LABELS_STORAGE_KEY, JSON.stringify(defaultLabels))
      return defaultLabels
    }
    return JSON.parse(raw)
  } catch (err) {
    console.error("Error reading client labels:", err)
    return []
  }
}

export function saveStoredClientLabel(label: ClientLabelItem): ClientLabelItem[] {
  if (typeof window === "undefined") return []
  try {
    const current = getStoredClientLabels()
    const updated = [...current, label]
    localStorage.setItem(CLIENT_LABELS_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Error saving client label:", err)
    return []
  }
}

export function deleteStoredClientLabel(id: string): ClientLabelItem[] {
  if (typeof window === "undefined") return []
  try {
    const current = getStoredClientLabels()
    const updated = current.filter((l) => l.id !== id)
    localStorage.setItem(CLIENT_LABELS_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error("Error deleting client label:", err)
    return []
  }
}
