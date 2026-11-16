import * as React from "react"
import { DocumentFormValues } from "../types"

export function useDocumentForm(
  uploadedBy: string,
  onCreate: (values: DocumentFormValues) => Promise<unknown>
) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [values, setValues] = React.useState<DocumentFormValues>({
    name: "",
    category: "General",
    type: "PDF",
    size: "1 MB",
    expiry: "",
    uploadedBy,
  })

  const openAdd = React.useCallback(() => {
    setValues({
      name: "",
      category: "General",
      type: "PDF",
      size: "1 MB",
      expiry: "",
      uploadedBy,
    })
    setIsOpen(true)
  }, [uploadedBy])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(<K extends keyof DocumentFormValues>(key: K, value: DocumentFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!values.name.trim()) return
      await onCreate(values)
      setIsOpen(false)
    },
    [onCreate, values]
  )

  return { isOpen, values, openAdd, close, updateField, handleSubmit }
}
