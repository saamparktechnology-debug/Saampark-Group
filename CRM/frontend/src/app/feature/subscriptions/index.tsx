"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Download, Filter } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { Subscription } from "./types"
import { getSubscriptions } from "./services/subscriptionService"
import { SubscriptionList } from "./components/SubscriptionList"

export default function SubscriptionsMain() {
  const { activeCompanyId } = useAuthStore()
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([])

  React.useEffect(() => {
    getSubscriptions(activeCompanyId || "tech").then(setSubscriptions)
  }, [activeCompanyId])

  const handleDelete = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your recurring revenue and billing cycles for {activeCompanyId === "digital" ? "SAAMPARK Digital" : "SAAMPARK Technology"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Filter size={16} />}>Filters</Button>
          <Button variant="secondary" leftIcon={<Download size={16} />}>Export</Button>
          <Button leftIcon={<Plus size={16} />}>New Subscription</Button>
        </div>
      </div>
      <SubscriptionList subscriptions={subscriptions} onDelete={handleDelete} />
    </motion.div>
  )
}
