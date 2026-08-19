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

export default function ClientsMain() {
  const [activeTab, setActiveTab] = React.useState<ClientTabMode>("overview")

  const [clients, setClients] = React.useState<ClientItem[]>([])
  const [contacts, setContacts] = React.useState<ContactItem[]>([])
  const [labels, setLabels] = React.useState<ClientLabelItem[]>([])

  const [isAddClientModalOpen, setIsAddClientModalOpen] = React.useState(false)
  const [isManageLabelsModalOpen, setIsManageLabelsModalOpen] = React.useState(false)
  const [selectedClientForEdit, setSelectedClientForEdit] = React.useState<ClientItem | null>(null)

  const handleSaveClient = (newClient: ClientItem) => {
    setClients((prev) => [newClient, ...prev.filter((c) => c.id !== newClient.id)])
  }

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  const handleAddLabel = (label: ClientLabelItem) => {
    setLabels((prev) => [...prev, label])
  }

  const handleDeleteLabel = (id: string) => {
    setLabels((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 max-w-[1600px] mx-auto p-2"
    >
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
        </div>
      </div>

      {/* Tab Views Content */}
      {activeTab === "overview" && <OverviewView />}
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
