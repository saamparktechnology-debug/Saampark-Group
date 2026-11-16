import * as React from "react"
import { Meeting, MeetingFormValues } from "../types"

export function useMeetingForm(
  defaultOrganizer: string,
  onSave: (payload: { id?: string; values: MeetingFormValues }) => Promise<unknown>
) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Meeting | null>(null)
  const [values, setValues] = React.useState<MeetingFormValues>({
    title: "",
    date: "",
    duration: "60",
    location: "",
    status: "Scheduled",
    organizer: defaultOrganizer,
    attendees: "",
  })

  const openAdd = React.useCallback(() => {
    setEditingItem(null)
    setValues({
      title: "",
      date: "",
      duration: "60",
      location: "",
      status: "Scheduled",
      organizer: defaultOrganizer,
      attendees: "",
    })
    setIsOpen(true)
  }, [defaultOrganizer])

  const openEdit = React.useCallback((item: Meeting) => {
    setEditingItem(item)
    setValues({
      title: item.title,
      date: item.date || "",
      duration: item.duration || "60",
      location: item.location || "",
      status: item.status,
      organizer: item.organizer || "",
      attendees: (item.attendees || []).join(", "),
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(
    <K extends keyof MeetingFormValues>(key: K, value: MeetingFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!values.title.trim()) return
      await onSave({ id: editingItem?.id, values })
      setIsOpen(false)
    },
    [editingItem, onSave, values]
  )

  return { isOpen, editingItem, values, openAdd, openEdit, close, updateField, handleSubmit }
}
