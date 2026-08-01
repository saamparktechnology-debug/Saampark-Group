"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"

type Payment = {
  id: string
  invoiceId: string
  paymentDate: string
  paymentMethod: string
  note: string
  amount: string
}

const MOCK_PAYMENTS: Payment[] = [
  { id: "P-1", invoiceId: "INV #14", paymentDate: "14-08-2026", paymentMethod: "PayPal Payments Standard", note: "Facere magni tempore rem.", amount: "$100.00" },
  { id: "P-2", invoiceId: "INV #15", paymentDate: "08-08-2026", paymentMethod: "PayPal Payments Standard", note: "Eveniet sit rerum qui.", amount: "$90.00" },
  { id: "P-3", invoiceId: "INV #22", paymentDate: "06-08-2026", paymentMethod: "Paytm", note: "Ratione dolores id qui nostrum quia vero.", amount: "$360.00" },
  { id: "P-4", invoiceId: "INV #23", paymentDate: "09-08-2026", paymentMethod: "PayPal Payments Standard", note: "Nostrum voluptate rem aut.", amount: "$90.00" },
  { id: "P-5", invoiceId: "INV #4", paymentDate: "08-08-2026", paymentMethod: "Stripe", note: "Ipsam quis officiis commodi aliquid nemo explicabo.", amount: "$4,000.00" },
  { id: "P-6", invoiceId: "INV #6", paymentDate: "14-08-2026", paymentMethod: "Paytm", note: "Maiores dolor minus suscipit repellat voluptates ducimus.", amount: "$77.00" },
  { id: "P-7", invoiceId: "INV #7", paymentDate: "14-08-2026", paymentMethod: "Stripe", note: "Velit ullam id quia consequatur sequi rerum.", amount: "$400.00" },
]

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "invoiceId",
    header: "Invoice ID",
    cell: ({ row }) => <div className="font-medium text-primary hover:underline cursor-pointer">{row.getValue("invoiceId")}</div>,
  },
  {
    accessorKey: "paymentDate",
    header: "Payment date",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("paymentDate")}</div>,
  },
  {
    accessorKey: "paymentMethod",
    header: "Payment method",
    cell: ({ row }) => <div>{row.getValue("paymentMethod")}</div>,
  },
  {
    accessorKey: "note",
    header: "Note",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("note")}</div>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <div className="font-medium text-right">{row.getValue("amount")}</div>,
  },
]

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = React.useState("list")

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Received</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />}>
            Add payment
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <Tabs 
          tabs={[{ id: 'list', label: 'List' }, { id: 'chart', label: 'Chart' }]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
        
        {activeTab === 'list' ? (
          <>
            <DataTable 
              columns={columns} 
              data={MOCK_PAYMENTS} 
              searchKey="invoiceId"
            />
            {/* Summary Footer */}
            <div className="border-t border-border mt-4 pt-4 flex justify-end gap-16 pr-[20%] text-sm">
              <div className="text-right font-semibold">Total</div>
              <div className="text-right font-semibold">$5,117.00</div>
            </div>
          </>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-hover border border-border flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-foreground">Chart View</h3>
            <p className="text-muted-foreground max-w-md mt-2">
              Visual representation of payment receipts over time. (Interactive placeholder)
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
