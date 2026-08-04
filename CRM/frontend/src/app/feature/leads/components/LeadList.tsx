import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/DataTable"
import { RowActions } from "@/components/ui/RowActions"
import { Lead } from "../types"
import { statusColors } from "../services/leadService"

interface LeadListProps {
  leads: Lead[]
  onDelete: (id: string) => void
}

export const LeadList: React.FC<LeadListProps> = ({ leads, onDelete }) => {
  const columns = React.useMemo<ColumnDef<Lead>[]>(() => [
    {
      accessorKey: "name",
      header: "Company / Lead",
      cell: ({ row }) => <div className="font-medium hover:text-primary cursor-pointer transition-colors">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "primaryContact",
      header: "Contact",
      cell: ({ row }) => {
        const c = row.getValue("primaryContact") as string
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center text-xs font-medium border border-border shrink-0">{c.charAt(0)}</div>
            <span className="text-sm">{c}</span>
          </div>
        )
      },
    },
    { 
      accessorKey: "phone", 
      header: "Phone", 
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("phone")}</span> 
    },
    {
      accessorKey: "owner",
      header: "Owner",
      cell: ({ row }) => {
        const o = row.getValue("owner") as string
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20 shrink-0">{o.charAt(0)}</div>
            <span className="text-sm">{o}</span>
          </div>
        )
      },
    },
    { 
      accessorKey: "value", 
      header: "Value", 
      cell: ({ row }) => <span className="font-semibold">{row.getValue("value")}</span> 
    },
    { 
      accessorKey: "createdAt", 
      header: "Created", 
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("createdAt")}</span> 
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as string
        return <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[s] || ""}`}>{s}</span>
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions 
          onView={() => alert(`Viewing details for ${row.original.name}`)} 
          onEdit={() => alert(`Editing ${row.original.name}`)} 
          onDelete={() => onDelete(row.original.id)} 
        />
      ),
    },
  ], [onDelete])

  return <DataTable columns={columns} data={leads} searchKey="name" />
}
