"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Download } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { RowActions } from "@/components/ui/RowActions"
import { useUIStore } from "@/store/useUIStore"

type Proposal = {
  id: string
  client: string
  proposalDate: string
  validUntil: string
  lastEmailSeen: string
  lastPreviewSeen: string
  amount: string
  status: "Accepted" | "Draft" | "Declined"
}

const MOCK_PROPOSALS: Proposal[] = [
  { id: "PROPOSAL #9", client: "Jane Hand", proposalDate: "19-06-2026", validUntil: "19-08-2026", lastEmailSeen: "19-06-2026 05:15 am", lastPreviewSeen: "19-06-2026 12:21 pm", amount: "₹8,300", status: "Accepted" },
  { id: "PROPOSAL #8", client: "Demo Client", proposalDate: "10-07-2026", validUntil: "13-08-2026", lastEmailSeen: "-", lastPreviewSeen: "10-07-2026 03:54 pm", amount: "₹83,000", status: "Accepted" },
  { id: "PROPOSAL #7", client: "Karl Kub", proposalDate: "26-07-2026", validUntil: "13-08-2026", lastEmailSeen: "-", lastPreviewSeen: "26-07-2026 04:24 pm", amount: "₹4,98,000", status: "Accepted" },
  { id: "PROPOSAL #6", client: "Kennedi Von", proposalDate: "30-06-2026", validUntil: "30-08-2026", lastEmailSeen: "-", lastPreviewSeen: "-", amount: "₹29,880", status: "Draft" },
  { id: "PROPOSAL #5", client: "Adrain Ondricka", proposalDate: "28-07-2026", validUntil: "28-08-2026", lastEmailSeen: "-", lastPreviewSeen: "28-07-2026 09:22 am", amount: "₹58,100", status: "Accepted" },
  { id: "PROPOSAL #4", client: "O'Reilly & Bartell", proposalDate: "29-07-2026", validUntil: "22-08-2026", lastEmailSeen: "-", lastPreviewSeen: "29-07-2026 02:09 pm", amount: "₹58,100", status: "Accepted" },
  { id: "PROPOSAL #3", client: "Kuphal, Borer and Stehr", proposalDate: "26-07-2026", validUntil: "13-08-2026", lastEmailSeen: "-", lastPreviewSeen: "-", amount: "₹83,000", status: "Draft" },
  { id: "PROPOSAL #21", client: "Sarah Cole", proposalDate: "04-08-2026", validUntil: "08-08-2026", lastEmailSeen: "-", lastPreviewSeen: "-", amount: "₹0", status: "Draft" },
  { id: "PROPOSAL #20", client: "Koch PLC", proposalDate: "29-06-2026", validUntil: "29-08-2026", lastEmailSeen: "-", lastPreviewSeen: "29-06-2026 02:03 pm", amount: "₹66,400", status: "Declined" },
  { id: "PROPOSAL #2", client: "Bernier & Collins", proposalDate: "30-07-2026", validUntil: "13-08-2026", lastEmailSeen: "-", lastPreviewSeen: "30-07-2026 05:48 pm", amount: "₹11,620", status: "Accepted" },
]

export const columns: ColumnDef<Proposal>[] = [
  {
    accessorKey: "id",
    header: "Proposal",
    cell: ({ row }) => <div className="font-medium text-primary hover:underline cursor-pointer">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => <div className="text-primary hover:underline cursor-pointer">{row.getValue("client")}</div>,
  },
  {
    accessorKey: "proposalDate",
    header: "Proposal date",
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.getValue("proposalDate")}</div>,
  },
  {
    accessorKey: "validUntil",
    header: "Valid until",
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.getValue("validUntil")}</div>,
  },
  {
    accessorKey: "lastEmailSeen",
    header: "Last email seen",
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.getValue("lastEmailSeen")}</div>,
  },
  {
    accessorKey: "lastPreviewSeen",
    header: "Last preview seen",
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.getValue("lastPreviewSeen")}</div>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <div className="font-medium">{row.getValue("amount")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let colorClass = "bg-surface-hover text-muted-foreground"
      if (status === "Draft") colorClass = "bg-surface-hover text-muted-foreground"
      if (status === "Accepted") colorClass = "bg-blue-600 text-white"
      if (status === "Declined") colorClass = "bg-danger text-danger-foreground"
      
      return (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
          {status}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "",
    cell: () => <RowActions onView={() => {}} onEdit={() => {}} onDelete={() => {}} />,
  }
]

export default function ProposalsPage() {
  const { openModal } = useUIStore()

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => openModal("isAddProposalModalOpen")}>
            Add proposal
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <div className="mb-4">
          <Button variant="ghost" size="sm" leftIcon={<Download size={14} />} className="text-muted-foreground">
            Filters
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={MOCK_PROPOSALS} 
          searchKey="client"
        />
        
        {/* Mock Summary Footer */}
        <div className="border-t border-border mt-4 pt-4 flex justify-end gap-16 pr-[15%] text-sm">
          <div className="text-right">
            <p className="font-semibold mb-2">Total</p>
            <p className="font-semibold text-muted-foreground">Total of all pages</p>
          </div>
          <div className="text-right">
            <p className="font-semibold mb-2">₹8,96,400</p>
            <p className="font-semibold text-muted-foreground">₹10,05,640</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
