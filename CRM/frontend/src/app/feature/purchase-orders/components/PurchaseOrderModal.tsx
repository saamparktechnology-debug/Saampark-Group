"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, X } from "lucide-react"
import { LineItem, PurchaseOrder, PurchaseOrderFormValues } from "../types"

interface PurchaseOrderModalProps {
  isOpen: boolean
  editingItem: PurchaseOrder | null
  values: PurchaseOrderFormValues
  items: LineItem[]
  subtotal: number
  tax: number
  grandTotal: number
  onClose: () => void
  onChange: <K extends keyof PurchaseOrderFormValues>(key: K, value: PurchaseOrderFormValues[K]) => void
  onItemChange: (id: string, field: keyof LineItem, value: string | number) => void
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function PurchaseOrderModal({
  isOpen,
  editingItem,
  values,
  items,
  subtotal,
  tax,
  grandTotal,
  onClose,
  onChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
}: PurchaseOrderModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Create"} Purchase Order</h3>
              <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Number</label>
                  <input
                    type="text"
                    value={values.number}
                    onChange={(e) => onChange("number", e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Vendor *</label>
                  <input
                    type="text"
                    required
                    value={values.vendor}
                    onChange={(e) => onChange("vendor", e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={values.date}
                    onChange={(e) => onChange("date", e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={onAddItem}
                    className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg items-center"
                    >
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Item"
                          value={item.name}
                          onChange={(e) => onItemChange(item.id, "name", e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => onItemChange(item.id, "quantity", Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => onItemChange(item.id, "unitPrice", Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-right"
                        />
                      </div>
                      <div className="col-span-3 text-right font-mono font-bold">
                        ₹{item.total.toLocaleString("en-IN")}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-zinc-400 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex justify-end">
                <div className="w-56 space-y-1 text-right text-xs">
                  <div>
                    Subtotal: <span className="font-semibold font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    GST (18%): <span className="font-semibold font-mono">₹{tax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="text-sm font-bold text-blue-600 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                    Total: ₹{grandTotal.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
