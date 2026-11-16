import * as React from "react"
import { Enquiry, EnquiryFormValues } from "../types"

const EMPTY_FORM: EnquiryFormValues = {
  subject: "",
  source: "Website",
  priority: "Medium",
  status: "New",
  assignedTo: "",
  notes: "",
}

export function useEnquiryForm(onSave: (payload: { id?: string; values: EnquiryFormValues }) => Promise<unknown>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Enquiry | null>(null)
  const [values, setValues] = React.useState<EnquiryFormValues>(EMPTY_FORM)

  const openAdd = React.useCallback(() => {
    setEditingItem(null)
    setValues(EMPTY_FORM)
    setIsOpen(true)
  }, [])

  const openEdit = React.useCallback((item: Enquiry) => {
    setEditingItem(item)
    setValues({
      subject: item.subject,
      source: item.source || "Website",
      priority: item.priority || "Medium",
      status: item.status,
      assignedTo: item.assignedTo || "",
      notes: item.notes || "",
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(<K extends keyof EnquiryFormValues>(key: K, value: EnquiryFormValues[K]) => {
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
