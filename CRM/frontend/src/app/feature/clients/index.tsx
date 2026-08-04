"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Download, Filter } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useUIStore } from "@/store/useUIStore"
import { useAuthStore } from "@/store/useAuthStore"
import { Client } from "./types"
import { getClients } from "./services/clientService"
import { ClientList } from "./components/ClientList"

export default function ClientsMain() {
  const { openModal } = useUIStore()
  const { activeCompanyId } = useAuthStore()

  const [clients, setClients] = React.useState<Client[]>([])

  React.useEffect(() => {
    getClients(activeCompanyId || "tech").then(setClients)
  }, [activeCompanyId])

  const handleDelete = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your clients, leads, and customer relationships for {activeCompanyId === "digital" ? "SAAMPARK Digital" : "SAAMPARK Technology"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Filter size={16} />}>Filters</Button>
          <Button variant="secondary" leftIcon={<Download size={16} />}>Export</Button>
          <Button leftIcon={<Plus size={16} />} onClick={() => openModal("isAddClientModalOpen")}>Add Client</Button>
        </div>
      </div>
      <ClientList clients={clients} onDelete={handleDelete} />
    </motion.div>
  )
}
