"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Edit2, X } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"

type TimeCard = {
  id: string
  member: string
  avatarUrl: string
  inDate: string
  inTime: string
  outDate: string
  outTime: string
  duration: string
}

const MOCK_TIMECARDS: TimeCard[] = [
  { id: "1", member: "Michael Wood", avatarUrl: "https://i.pravatar.cc/150?u=3", inDate: "01-08-2026", inTime: "06:45:12 pm", outDate: "-", outTime: "-", duration: "00:00:00" },
  { id: "2", member: "Sara Ann", avatarUrl: "https://i.pravatar.cc/150?u=5", inDate: "01-08-2026", inTime: "06:45:07 pm", outDate: "-", outTime: "-", duration: "00:00:00" },
  { id: "3", member: "Richard Gray", avatarUrl: "https://i.pravatar.cc/150?u=4", inDate: "01-08-2026", inTime: "11:45:00 am", outDate: "01-08-2026", outTime: "05:20:00 pm", duration: "05:35:00" },
  { id: "4", member: "Mark Thomas", avatarUrl: "https://i.pravatar.cc/150?u=2", inDate: "01-08-2026", inTime: "11:30:00 am", outDate: "01-08-2026", outTime: "02:45:00 pm", duration: "03:15:00" },
  { id: "5", member: "Michael Wood", avatarUrl: "https://i.pravatar.cc/150?u=3", inDate: "01-08-2026", inTime: "10:50:00 am", outDate: "01-08-2026", outTime: "05:15:00 pm", duration: "06:25:00" },
  { id: "6", member: "Sara Ann", avatarUrl: "https://i.pravatar.cc/150?u=5", inDate: "01-08-2026", inTime: "09:40:00 am", outDate: "01-08-2026", outTime: "05:35:00 pm", duration: "07:55:00" },
  { id: "7", member: "John Doe", avatarUrl: "https://i.pravatar.cc/150?u=1", inDate: "01-08-2026", inTime: "09:25:00 am", outDate: "01-08-2026", outTime: "03:15:00 pm", duration: "05:50:00" },
  { id: "8", member: "John Doe", avatarUrl: "https://i.pravatar.cc/150?u=1", inDate: "01-08-2026", inTime: "07:46:40 am", outDate: "-", outTime: "-", duration: "00:00:00" },
]

export const columns: ColumnDef<TimeCard>[] = [
  {
    accessorKey: "member",
    header: "Team member",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img src={row.original.avatarUrl} alt={row.getValue("member")} className="w-6 h-6 rounded-full object-cover border border-border" />
        <span className="font-medium text-primary hover:underline cursor-pointer text-sm">{row.getValue("member")}</span>
      </div>
    ),
  },
  {
    accessorKey: "inDate",
    header: "In Date",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("inDate")}</div>,
  },
  {
    accessorKey: "inTime",
    header: "In Time",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("inTime")}</div>,
  },
  {
    accessorKey: "outDate",
    header: "Out Date",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("outDate")}</div>,
  },
  {
    accessorKey: "outTime",
    header: "Out Time",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("outTime")}</div>,
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => <div className="font-medium">{row.getValue("duration")}</div>,
  },
  {
    id: "actions",
    cell: () => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"><Edit2 size={14} /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger"><X size={14} /></Button>
      </div>
    ),
  }
]

export default function TimeCardsPage() {
  const [activeTab, setActiveTab] = React.useState("daily")

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time cards</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />}>
            Add time manually
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <Tabs 
          tabs={[
            { id: 'daily', label: 'Daily' }, 
            { id: 'custom', label: 'Custom' },
            { id: 'summary', label: 'Summary' },
            { id: 'details', label: 'Summary details' },
            { id: 'clocked', label: 'Members Clocked In' },
            { id: 'clockinout', label: 'Clock in-out' },
          ]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
        
        <div className="mb-4 flex items-center gap-2">
          <select className="h-9 rounded-md border border-border bg-background px-3 py-1 text-sm text-muted-foreground outline-none focus:ring-1 focus:ring-primary min-w-[150px]">
            <option>- Member -</option>
          </select>
          <div className="flex items-center bg-background border border-border rounded-md overflow-hidden h-9">
            <button className="px-3 hover:bg-surface-hover text-muted-foreground border-r border-border">&lt;</button>
            <span className="px-4 text-sm font-medium">Today</span>
            <button className="px-3 hover:bg-surface-hover text-muted-foreground border-l border-border">&gt;</button>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={MOCK_TIMECARDS} 
          searchKey="member"
        />

        <div className="border-t border-border mt-4 pt-4 flex justify-end gap-16 pr-[15%] text-sm">
          <div className="text-right font-semibold">Total</div>
          <div className="text-right font-semibold">29:00:00</div>
        </div>
      </div>
    </motion.div>
  )
}
