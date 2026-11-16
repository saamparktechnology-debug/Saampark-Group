import * as React from "react"
import { TaxRate, TaxRateFormValues } from "../types"

const EMPTY_FORM: TaxRateFormValues = {
  name: "",
  rate: 0,
  type: "GST",
  status: "Active",
}

export function useTaxRateForm(onSave: (payload: { id?: string; values: TaxRateFormValues }) => Promise<unknown>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<TaxRate | null>(null)
  const [values, setValues] = React.useState<TaxRateFormValues>(EMPTY_FORM)

  const openAdd = React.useCallback(() => {
    setEditingItem(null)
    setValues(EMPTY_FORM)
    setIsOpen(true)
  }, [])

  const openEdit = React.useCallback((item: TaxRate) => {
    setEditingItem(item)
    setValues({
      name: item.name,
      rate: item.rate,
      type: item.type,
      status: item.status,
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  const updateField = React.useCallback(<K extends keyof TaxRateFormValues>(key: K, value: TaxRateFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!values.name.trim()) return
      await onSave({ id: editingItem?.id, values })
      setIsOpen(false)
    },
    [editingItem, onSave, values]
  )

  return {
    isOpen,
    editingItem,
    values,
    openAdd,
    openEdit,
    close,
    updateField,
    handleSubmit,
  }
}
