import * as React from "react"
import { LineItem, PurchaseOrder, PurchaseOrderFormValues } from "../types"
import { PurchaseOrderPayload } from "../service/purchaseOrderService"

const EMPTY_ITEM: LineItem = { id: "1", name: "", quantity: 1, unitPrice: 0, total: 0 }

export function usePurchaseOrderForm(
  companyId: string | null | undefined,
  onSave: (args: { id?: string; payload: PurchaseOrderPayload }) => Promise<unknown>
) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<PurchaseOrder | null>(null)
  const [values, setValues] = React.useState<PurchaseOrderFormValues>({
    number: "",
    vendor: "",
    date: "",
    status: "Draft",
  })
  const [items, setItems] = React.useState<LineItem[]>([EMPTY_ITEM])

  const subtotal = React.useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items]
  )
  const tax = React.useMemo(() => Math.round(subtotal * 0.18), [subtotal])
  const grandTotal = subtotal + tax

  const openAdd = React.useCallback(() => {
    setEditingItem(null)
    setValues({
      number: `PO-${Date.now().toString().slice(-6)}`,
      vendor: "",
      date: new Date().toISOString().split("T")[0],
      status: "Draft",
    })
    setItems([{ ...EMPTY_ITEM }])
    setIsOpen(true)
  }, [])

  const openEdit = React.useCallback((item: PurchaseOrder) => {
    setEditingItem(item)
    setValues({
      number: item.number,
      vendor: item.vendor,
      date: item.date,
      status: item.status,
    })
    setItems(item.items?.length ? item.items : [{ ...EMPTY_ITEM }])
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(
    <K extends keyof PurchaseOrderFormValues>(key: K, value: PurchaseOrderFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleItemChange = React.useCallback((id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === "quantity" || field === "unitPrice") {
          updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0)
        }
        return updated
      })
    )
  }, [])

  const addItem = React.useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", quantity: 1, unitPrice: 0, total: 0 },
    ])
  }, [])

  const removeItem = React.useCallback((id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev))
  }, [])

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!values.vendor.trim()) return
      await onSave({
        id: editingItem?.id,
        payload: {
          ...values,
          items,
          subtotal,
          tax,
          total: grandTotal,
          companyId,
        },
      })
      setIsOpen(false)
    },
    [companyId, editingItem, grandTotal, items, onSave, subtotal, tax, values]
  )

  return {
    isOpen,
    editingItem,
    values,
    items,
    subtotal,
    tax,
    grandTotal,
    openAdd,
    openEdit,
    close,
    updateField,
    handleItemChange,
    addItem,
    removeItem,
    handleSubmit,
  }
}
