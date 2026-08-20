"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Tag, Upload, Plus } from "lucide-react"

import { ClientTabMode, ClientItem, ContactItem, ClientLabelItem } from "./types"
import { OverviewView } from "./components/OverviewView"
import { ClientsTableView } from "./components/ClientsTableView"
import { ContactsTableView } from "./components/ContactsTableView"
import { AddClientModal } from "./components/AddClientModal"
import { ManageClientLabelsModal } from "./components/ManageClientLabelsModal"
import {
  getStoredClients,
  saveStoredClient,
  deleteStoredClient,
  getStoredContacts,
  saveStoredContact,
  deleteStoredContact,
  getStoredClientLabels,
  saveStoredClientLabel,
  deleteStoredClientLabel,
} from "./services/clientService"
import { getUsers } from "@/app/feature/users/services/userService"

import { useAuthStore } from "@/store/useAuthStore"
import { usePermissionStore } from "@/store/usePermissionStore"

export default function ClientsMain() {
  const { user } = useAuthStore()
  const { canPerformAction } = usePermissionStore()

  const canAddClient = canPerformAction(user, "Clients", "add")
  const canDeleteClient = canPerformAction(user, "Clients", "delete")

  const [activeTab, setActiveTab] = React.useState<ClientTabMode>("overview")

  const [clients, setClients] = React.useState<ClientItem[]>([])
  const [contacts, setContacts] = React.useState<ContactItem[]>([])
  const [labels, setLabels] = React.useState<ClientLabelItem[]>([])

  const [isAddClientModalOpen, setIsAddClientModalOpen] = React.useState(false)
  const [isManageLabelsModalOpen, setIsManageLabelsModalOpen] = React.useState(false)
  const [selectedClientForEdit, setSelectedClientForEdit] = React.useState<ClientItem | null>(null)

  // Sync real client users from userService with local client store
  const loadClientData = React.useCallback(async () => {
    try {
      const allUsers = await getUsers()
      const clientUsers = allUsers.filter((u) => u.role === "Clients")
      const storedClients = getStoredClients()
      const storedContacts = getStoredContacts()
      const storedLabels = getStoredClientLabels()

      // Convert user management client users into ClientItem format
      const userClientsMap = new Map<string, ClientItem>()

      // 1. Convert registered client users
      clientUsers.forEach((cu) => {
        const emailKey = cu.email.toLowerCase().trim()
        userClientsMap.set(emailKey, {
          id: cu.id || `cli_${cu.email}`,
          name: cu.companyName || cu.name || "Client Account",
          primaryContact: cu.name || "Primary Contact",
          email: cu.email,
          phone: cu.phone || "N/A",
          group: "VIP",
          label: "Potential",
          labelColor: "#3b82f6",
          projectsCount: 1,
          totalInvoiced: "₹0",
          paymentReceived: "₹0",
          due: "₹0",
        })

      })

      // 2. Add manually stored clients
      storedClients.forEach((sc) => {
        userClientsMap.set(sc.id, sc)
      })

      const mergedClients = Array.from(userClientsMap.values())
      setClients(mergedClients)

      // Convert registered client users into ContactItem format
      const userContactsMap = new Map<string, ContactItem>()
      clientUsers.forEach((cu) => {
        const emailKey = cu.email.toLowerCase().trim()
        userContactsMap.set(emailKey, {
          id: `cnt_${cu.id}`,
          name: cu.name,
          clientName: cu.companyName || cu.name,
          jobTitle: "Primary Contact",
          email: cu.email,
          phone: cu.phone || "N/A",
          avatarSeed: cu.name,
        })
      })

      storedContacts.forEach((sc) => {
        userContactsMap.set(sc.id, sc)
      })

      setContacts(Array.from(userContactsMap.values()))
      setLabels(storedLabels)
    } catch (err) {
      console.warn("Client sync warning:", err)
    }
  }, [])

  React.useEffect(() => {
    loadClientData()
    const handleStorage = () => loadClientData()
    window.addEventListener("storage", handleStorage)
    const interval = setInterval(loadClientData, 2500)

    return () => {
      window.removeEventListener("storage", handleStorage)
      clearInterval(interval)
    }
  }, [loadClientData])

  const handleSaveClient = (newClient: ClientItem) => {
    const updated = saveStoredClient(newClient)
    setClients(updated)
    loadClientData()
  }

  const handleDeleteClient = (id: string) => {
    if (!canDeleteClient) {
      alert("Action forbidden: You do not have permission to delete clients.")
      return
    }
    const updated = deleteStoredClient(id)
    setClients(updated)
    loadClientData()
  }

  const handleDeleteContact = (id: string) => {
    const updated = deleteStoredContact(id)
    setContacts(updated)
    loadClientData()
  }

  const handleAddLabel = (label: ClientLabelItem) => {
    const updated = saveStoredClientLabel(label)
    setLabels(updated)
  }

  const handleDeleteLabel = (id: string) => {
    const updated = deleteStoredClientLabel(id)
    setLabels(updated)
  }


  const isClientRole = user?.role === "Clients"

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 max-w-[1600px] mx-auto p-2"
    >
      {/* Pending Client Details Notice Banner */}
      {isClientRole && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-lg shrink-0 mt-0.5">
            ⏳
          </div>
          <div>
            <h3 className="font-bold text-sm">Client Account Registered — Details Pending Admin Review</h3>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Welcome to your SAAMPARK Client Section! Your account is registered. An Administrator will review and fill out your organization profile, assigned contacts, and contract terms shortly.
            </p>
          </div>
        </div>
      )}

      {/* Header & Tabs Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        {/* Top View Tabs: Overview, Clients, Contacts */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`text-sm font-semibold pb-2 relative transition-colors ${
              activeTab === "overview"
                ? "text-slate-800 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Overview
            {activeTab === "overview" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("clients")}
            className={`text-sm font-semibold pb-2 relative transition-colors ${
              activeTab === "clients"
                ? "text-slate-800 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Clients
            {activeTab === "clients" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("contacts")}
            className={`text-sm font-semibold pb-2 relative transition-colors ${
              activeTab === "contacts"
                ? "text-slate-800 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Contacts
            {activeTab === "contacts" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
              />
            )}
          </button>
        </div>

        {/* Top Right Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsManageLabelsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Tag size={14} className="text-slate-500" />
            <span>Manage labels</span>
          </button>

          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Upload size={14} className="text-slate-500" />
            <span>{activeTab === "contacts" ? "Import contacts" : "Import clients"}</span>
          </button>

          {canAddClient && (
            <button
              type="button"
              onClick={() => {
                setSelectedClientForEdit(null)
                setIsAddClientModalOpen(true)
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Plus size={14} className="text-slate-600" />
              <span>Add client</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Views Content */}
      {activeTab === "overview" && (
        <OverviewView totalClients={clients.length} totalContacts={contacts.length} />
      )}

      {activeTab === "clients" && (
        <ClientsTableView
          clients={clients}
          onDeleteClient={handleDeleteClient}
          onEditClient={(client) => {
            setSelectedClientForEdit(client)
            setIsAddClientModalOpen(true)
          }}
        />
      )}
      {activeTab === "contacts" && (
        <ContactsTableView
          contacts={contacts}
          onDeleteContact={handleDeleteContact}
        />
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onSave={handleSaveClient}
        initialData={selectedClientForEdit}
      />

      {/* Manage Labels Modal */}
      <ManageClientLabelsModal
        isOpen={isManageLabelsModalOpen}
        onClose={() => setIsManageLabelsModalOpen(false)}
        labels={labels}
        onAddLabel={handleAddLabel}
        onDeleteLabel={handleDeleteLabel}
      />
    </motion.div>
  )
}
