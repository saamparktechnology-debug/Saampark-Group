import * as React from "react"
import { Employee, EmployeeFormValues } from "../types"

const EMPTY_FORM: EmployeeFormValues = {
  code: "",
  name: "",
  department: "",
  designation: "",
  email: "",
  phone: "",
  status: "Active",
}

export function useEmployeeForm(onSave: (payload: { id?: string; values: EmployeeFormValues }) => Promise<unknown>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Employee | null>(null)
  const [values, setValues] = React.useState<EmployeeFormValues>(EMPTY_FORM)

  const openAdd = React.useCallback(() => {
    setEditingItem(null)
    setValues({ ...EMPTY_FORM, code: `EMP-${Date.now().toString().slice(-4)}` })
    setIsOpen(true)
  }, [])

  const openEdit = React.useCallback((item: Employee) => {
    setEditingItem(item)
    setValues({
      code: item.code,
      name: item.name,
      department: item.department,
      designation: item.designation,
      email: item.email,
      phone: item.phone,
      status: item.status,
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) => {
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
