import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/DataTable"
import { RowActions } from "@/components/ui/RowActions"
import { Subscription } from "../types"

interface SubscriptionListProps {
  subscriptions: Subscription[]
  onDelete: (id: string) => void
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({ subscriptions, onDelete }) => {
  const columns = React.useMemo<ColumnDef<Subscription>[]>(() => [
    {
      accessorKey: "clientName",
      header: "Client Name",
      cell: ({ row }) => <div className="font-medium hover:text-primary cursor-pointer transition-colors">{row.getValue("clientName")}</div>,
    },
    { 
      accessorKey: "planName", 
      header: "Plan", 
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("planName")}</span> 
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as string
        let c = "bg-success/10 text-success border-success/20"
        if (s === "Canceled") c = "bg-danger/10 text-danger border-danger/20"
        if (s === "Past Due") c = "bg-warning/10 text-warning border-warning/20"
        if (s === "Trial") c = "bg-info/10 text-info border-info/20"
        return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${c}`}>{s}</span>
      },
    },
    { 
      accessorKey: "amount", 
      header: "Amount", 
      cell: ({ row }) => <span className="font-semibold">{row.getValue("amount")}</span> 
    },
    {
      accessorKey: "billingCycle",
      header: "Billing Cycle",
    },
    {
      accessorKey: "nextBillingDate",
      header: "Next Billing",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.getValue("nextBillingDate")}</span>
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          onView={() => alert(`Viewing subscription for ${row.original.clientName}`)}
          onEdit={() => alert(`Editing subscription for ${row.original.clientName}`)}
          onDelete={() => onDelete(row.original.id)}
        />
      ),
    },
  ], [onDelete])

  return <DataTable columns={columns} data={subscriptions} searchKey="clientName" />
}
