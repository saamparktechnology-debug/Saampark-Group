import * as React from "react"
import { Team, TeamFormValues } from "../types"

const EMPTY_FORM: TeamFormValues = {
  name: "",
  description: "",
  lead: "",
}

export function useTeamForm(
  onSave: (payload: { id?: string; values: TeamFormValues }) => Promise<unknown>
) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingTeam, setEditingTeam] = React.useState<Team | null>(null)
  const [values, setValues] = React.useState<TeamFormValues>(EMPTY_FORM)

  const openAdd = React.useCallback(() => {
    setEditingTeam(null)
    setValues(EMPTY_FORM)
    setIsOpen(true)
  }, [])

  const openEdit = React.useCallback((team: Team) => {
    setEditingTeam(team)
    setValues({
      name: team.name,
      description: team.description || "",
      lead: team.lead || "",
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(
    <K extends keyof TeamFormValues>(key: K, value: TeamFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!values.name.trim()) return
      await onSave({ id: editingTeam?.id, values })
      setIsOpen(false)
    },
    [editingTeam, onSave, values]
  )

  return { isOpen, editingTeam, values, openAdd, openEdit, close, updateField, handleSubmit }
}
