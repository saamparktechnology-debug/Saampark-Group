import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/DataTable"
import { RowActions } from "@/components/ui/RowActions"
import { Client } from "../types"

interface ClientListProps {
  clients: Client[]
  onDelete: (id: string) => void
}

export const ClientList: React.FC<ClientListProps> = ({ clients, onDelete }) => {
  const columns = React.useMemo<ColumnDef<Client>[]>(() => [
    {
      accessorKey: "name",
      header: "Client Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
            {row.original.name.charAt(0)}
          </div>
          <div className="font-medium hover:text-primary cursor-pointer transition-colors">{row.getValue("name")}</div>
        </div>
      ),
    },
    { 
      accessorKey: "email", 
      header: "Email", 
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("email")}</span> 
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as string
        let c = "bg-success/10 text-success border-success/20"
        if (s === "Inactive") c = "bg-danger/10 text-danger border-danger/20"
        if (s === "Lead") c = "bg-warning/10 text-warning border-warning/20"
        return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${c}`}>{s}</span>
      },
    },
    { accessorKey: "projects", header: "Projects" },
    { 
      accessorKey: "amount", 
      header: "Total Revenue", 
      cell: ({ row }) => <span className="font-semibold">{row.getValue("amount")}</span> 
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

  return <DataTable columns={columns} data={clients} searchKey="name" />
}
