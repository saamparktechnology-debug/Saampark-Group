import * as React from "react"
import { CloudFileFormValues } from "../types"

const INITIAL_FORM: CloudFileFormValues = {
  name: "",
  category: "Project Deliverables",
  linkType: "Google Drive",
  url: "",
  fileSize: "12.4 MB",
  fileExtension: "G-Drive / Folder",
  notes: "",
}

export function useFileForm() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [values, setValues] = React.useState<CloudFileFormValues>(INITIAL_FORM)

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(
    <K extends keyof CloudFileFormValues>(key: K, value: CloudFileFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const reset = React.useCallback(() => {
    setValues((prev) => ({ ...prev, name: "", url: "", notes: "" }))
  }, [])

  return { isOpen, values, open, close, updateField, reset }
}
