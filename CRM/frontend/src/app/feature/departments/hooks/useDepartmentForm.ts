import * as React from "react"
import { Department, DepartmentFormValues, Designation } from "../types"

const EMPTY_FORM: DepartmentFormValues = {
  name: "",
  code: "",
  head: "",
  level: "",
}

export function useDepartmentForm(onSave: (payload: { id?: string; values: DepartmentFormValues }) => Promise<unknown>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Department | Designation | null>(null)
  const [values, setValues] = React.useState<DepartmentFormValues>(EMPTY_FORM)

  const openAdd = React.useCallback(() => {
    setEditingItem(null)
    setValues(EMPTY_FORM)
    setIsOpen(true)
  }, [])

  const openEdit = React.useCallback((item: Department | Designation) => {
    setEditingItem(item)
    setValues({
      name: item.name,
      code: (item as Department).code || "",
      head: (item as Department).head || "",
      level: (item as Designation).level || "",
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(<K extends keyof DepartmentFormValues>(key: K, value: DepartmentFormValues[K]) => {
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

  return { isOpen, editingItem, values, openAdd, openEdit, close, updateField, handleSubmit }
}
