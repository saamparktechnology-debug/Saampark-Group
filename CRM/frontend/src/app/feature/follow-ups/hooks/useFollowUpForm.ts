import * as React from "react"
import { FollowUp, FollowUpFormValues } from "../types"

const EMPTY_FORM: FollowUpFormValues = {
  subject: "",
  type: "Call",
  scheduledDate: "",
  status: "Pending",
  assignedTo: "",
  notes: "",
}

export function useFollowUpForm(onSave: (payload: { id?: string; values: FollowUpFormValues }) => Promise<unknown>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<FollowUp | null>(null)
  const [values, setValues] = React.useState<FollowUpFormValues>(EMPTY_FORM)

  const openAdd = React.useCallback(() => {
    setEditingItem(null)
    setValues(EMPTY_FORM)
    setIsOpen(true)
  }, [])

  const openEdit = React.useCallback((item: FollowUp) => {
    setEditingItem(item)
    setValues({
      subject: item.subject,
      type: item.type || "Call",
      scheduledDate: item.scheduledDate || "",
      status: item.status,
      assignedTo: item.assignedTo || "",
      notes: item.notes || "",
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(<K extends keyof FollowUpFormValues>(key: K, value: FollowUpFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!values.subject.trim()) return
      await onSave({ id: editingItem?.id, values })
      setIsOpen(false)
    },
    [editingItem, onSave, values]
  )

  return { isOpen, editingItem, values, openAdd, openEdit, close, updateField, handleSubmit }
}
