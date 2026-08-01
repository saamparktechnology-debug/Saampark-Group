"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Download, Mail, X, ExternalLink } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"
import { RowActions } from "@/components/ui/RowActions"
import { useUIStore } from "@/store/useUIStore"

type TeamMember = {
  id: string
  name: string
  avatarUrl: string
  jobTitle: string
  email: string
  phone: string
  status: "Online" | "Offline"
}

const MOCK_MEMBERS: TeamMember[] = [
  { id: "1", name: "John Doe", avatarUrl: "https://i.pravatar.cc/150?u=1", jobTitle: "Admin", email: "admin@demo.com", phone: "+12345678971", status: "Online" },
  { id: "2", name: "Mark Thomas", avatarUrl: "https://i.pravatar.cc/150?u=2", jobTitle: "Web Developer", email: "mark@demo.com", phone: "+12345678975", status: "Offline" },
  { id: "3", name: "Michael Wood", avatarUrl: "https://i.pravatar.cc/150?u=3", jobTitle: "Project Manager", email: "michael@demo.com", phone: "+12345678972", status: "Online" },
  { id: "4", name: "Richard Gray", avatarUrl: "https://i.pravatar.cc/150?u=4", jobTitle: "Web Developer", email: "richard@demo.com", phone: "+12345678974", status: "Online" },
  { id: "5", name: "Sara Ann", avatarUrl: "https://i.pravatar.cc/150?u=5", jobTitle: "Web Designer", email: "sara@demo.com", phone: "+12345678973", status: "Offline" },
]

export const columns: ColumnDef<TeamMember>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={row.original.avatarUrl} alt={row.getValue("name")} className="w-8 h-8 rounded-full object-cover border border-border" />
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface ${row.original.status === "Online" ? "bg-success" : "bg-muted-foreground/40"}`} />
        </div>
        <span className="font-medium text-primary hover:underline cursor-pointer">{row.getValue("name")}</span>
      </div>
    ),
  },
  { accessorKey: "jobTitle", header: "Job Title", cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("jobTitle")}</div> },
  { accessorKey: "email", header: "Email", cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email")}</div> },
  { accessorKey: "phone", header: "Phone", cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("phone")}</div> },
  {
    id: "actions",
    header: "",
    cell: () => <RowActions onView={() => {}} onEdit={() => {}} onDelete={() => {}} />,
  }
]

export default function TeamMembersPage() {
  const [activeTab, setActiveTab] = React.useState("active")
  const { openModal } = useUIStore()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team members</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>Import team members</Button>
          <Button variant="secondary" size="sm" leftIcon={<Mail size={14} />} onClick={() => openModal("isSendInvitationOpen")}>Send invitation</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => openModal("isAddMemberModalOpen")}>Add member</Button>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <Tabs
          tabs={[{ id: "active", label: "Active members" }, { id: "inactive", label: "Inactive members" }]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <DataTable columns={columns} data={MOCK_MEMBERS} searchKey="name" />
      </div>
    </motion.div>
  )
}
