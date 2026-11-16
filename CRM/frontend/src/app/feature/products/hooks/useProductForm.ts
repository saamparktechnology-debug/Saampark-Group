import * as React from "react"
import { Product, ProductFormValues } from "../types"

const EMPTY_FORM: ProductFormValues = {
  name: "",
  sku: "",
  category: "",
  price: 0,
  stock: 0,
  status: "Active",
  description: "",
}

export function useProductForm(
  onSave: (payload: { id?: string; values: ProductFormValues }) => Promise<unknown>
) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Product | null>(null)
  const [values, setValues] = React.useState<ProductFormValues>(EMPTY_FORM)

  const openAdd = React.useCallback(() => {
    setEditingItem(null)
    setValues({ ...EMPTY_FORM, sku: `SKU-${Date.now().toString().slice(-6)}` })
    setIsOpen(true)
  }, [])

  const openEdit = React.useCallback((item: Product) => {
    setEditingItem(item)
    setValues({
      name: item.name,
      sku: item.sku,
      category: item.category,
      price: item.price,
      stock: item.stock,
      status: item.status,
      description: item.description || "",
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(
    <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!values.name.trim()) return
      await onSave({ id: editingItem?.id, values })
      setIsOpen(false)
    },
    [editingItem, onSave, values]
  )

  return { isOpen, editingItem, values, openAdd, openEdit, close, updateField, handleSubmit }
}
