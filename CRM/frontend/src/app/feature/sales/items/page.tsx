"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, Download, Edit2, Trash2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"

type Item = {
  id: string
  title: string
  description: string
  category: string
  unitType: string
  rate: number
}

const MOCK_ITEMS: Item[] = [
  { id: "I-1", title: "Website Design", description: "Custom website templates for your brand.", category: "Design", unitType: "Hour", rate: 20 },
  { id: "I-2", title: "SEO", description: "SEO for your websites", category: "Services", unitType: "Hour", rate: 10 },
  { id: "I-3", title: "Logo Design", description: "Logo design for your brand.", category: "Design", unitType: "PC", rate: 100 },
  { id: "I-4", title: "Domain .com", description: "Get a dot com domain", category: "Services", unitType: "PC", rate: 900 },
  { id: "I-5", title: "Custom app development", description: "App for your business", category: "Development", unitType: "PC", rate: 1000 },
  { id: "I-6", title: "Content writing", description: "We write content for different types of websites, apps, etc.", category: "Services", unitType: "Hour", rate: 15 },
  { id: "I-7", title: "bas", description: "zz", category: "Design", unitType: "z", rate: 0 },
  { id: "I-8", title: "Art pictures", description: "Hand art pictures for your website.", category: "Design", unitType: "PC", rate: 40 },
  { id: "I-9", title: "10GB Hosting", description: "Cloud Hosting service 10GB Space\n- Free support\n- 24 hours up time\n- Supper fast", category: "Services", unitType: "PC", rate: 100 },
]

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
          <span className="text-[10px] font-bold">📄</span>
        </div>
        <span className="font-medium text-primary hover:underline cursor-pointer">{row.getValue("title")}</span>
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="text-muted-foreground whitespace-pre-wrap text-sm max-w-[400px]">
        {row.getValue("description")}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("category")}</div>,
  },
  {
    accessorKey: "unitType",
    header: "Unit type",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("unitType")}</div>,
  },
  {
    accessorKey: "rate",
    header: "Rate",
    cell: ({ row }) => <div className="font-medium text-right pr-4">₹{row.getValue("rate")}</div>,
  },
  {
    id: "actions",
    cell: () => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"><Edit2 size={14} /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger"><Trash2 size={14} /></Button>
      </div>
    ),
  }
]

export default function ItemsPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Items</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>
            Import items
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>
            Add item
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6">
        <div className="mb-4">
          <select className="h-9 rounded-md border border-border bg-background px-3 py-1 text-sm text-muted-foreground outline-none focus:ring-1 focus:ring-primary min-w-[150px]">
            <option>- Category -</option>
            <option>Design</option>
            <option>Services</option>
            <option>Development</option>
          </select>
        </div>

        <DataTable 
          columns={columns} 
          data={MOCK_ITEMS} 
          searchKey="title"
        />
      </div>
    </motion.div>
  )
}
