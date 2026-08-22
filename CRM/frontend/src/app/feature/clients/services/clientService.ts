"use client"

import { ClientItem, ContactItem, ClientLabelItem } from "../types"
import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"
import { markUserAsDeleted } from "@/app/feature/users/services/userService"

const CLIENTS_STORAGE_KEY = "saampark_stored_clients"
const CONTACTS_STORAGE_KEY = "saampark_stored_contacts"
const CLIENT_LABELS_STORAGE_KEY = "saampark_stored_client_labels"

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
    return filterGlobalDeletedItems(local)
  } catch (err) {
    console.error("Error reading stored clients:", err)
    return []
  }
}

export function saveStoredClient(client: ClientItem): ClientItem[] {
  if (typeof window === "undefined") return []
  try {
    const current = getStoredClients()
    const updated = [client, ...current.filter((c) => c.id !== client.id && c.email?.toLowerCase().trim() !== client.email?.toLowerCase().trim())]
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated))
    saveModuleDataToDB("clients", updated)

    // Automatically sync contact entry for this client
    saveStoredContact({
      id: `cnt_${client.id}`,
      name: client.primaryContact || client.name,
      clientName: client.name,
      jobTitle: "Primary Contact",
      email: client.email || `${client.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@saampark-client.com`,
      phone: client.phone || "N/A",
      avatarSeed: client.primaryContact || client.name,
    })

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
