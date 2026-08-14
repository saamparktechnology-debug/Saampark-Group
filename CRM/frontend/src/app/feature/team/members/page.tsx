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
import { UserService } from "@/services/apiServices"

type TeamMember = {
  id: string
  name: string
  avatarUrl: string
  jobTitle: string
  email: string
  phone: string
  status: "Online" | "Offline"
}

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
  const [members, setMembers] = React.useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    setIsLoading(true)
    UserService.getTeamMembers()
      .then((res) => {
        if (Array.isArray(res)) {
          const live: TeamMember[] = res.map((u: any, idx: number) => ({
            id: String(u.id || u._id || idx),
            name: u.full_name || u.name || u.email || 'Team Member',
            avatarUrl: u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.email || idx}`,
            jobTitle: u.role_name || u.role || 'Member',
            email: u.email || '-',
            phone: u.phone || '-',
            status: u.status === 'active' ? 'Online' : 'Offline',
          }))
          setMembers(live)
        }
      })
      .catch((err) => console.error("Error loading team members API:", err))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground mt-1">Live team members loaded directly from backend API.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Download size={16} />}>Export</Button>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => openModal("isAddMemberModalOpen")}>Add Member</Button>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <Tabs
          tabs={[
            { id: "active", label: "Active Members" },
            { id: "all", label: "All Members" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <DataTable columns={columns} data={members} searchKey="name" />
      </div>
    </motion.div>
  )
}
