import * as React from "react"
import { KnowledgeArticle, KnowledgeArticleFormValues } from "../types"

const EMPTY_FORM: KnowledgeArticleFormValues = {
  title: "",
  category: "General",
  content: "",
  status: "Published",
}

export function useKnowledgeArticleForm(
  onSave: (payload: { id?: string; values: KnowledgeArticleFormValues }) => Promise<unknown>
) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<KnowledgeArticle | null>(null)
  const [values, setValues] = React.useState<KnowledgeArticleFormValues>(EMPTY_FORM)

  const openAdd = React.useCallback(() => {
    setEditingItem(null)
    setValues(EMPTY_FORM)
    setIsOpen(true)
  }, [])

  const openEdit = React.useCallback((item: KnowledgeArticle) => {
    setEditingItem(item)
    setValues({
      title: item.title,
      category: item.category,
      content: item.content,
      status: item.status,
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(
    <K extends keyof KnowledgeArticleFormValues>(key: K, value: KnowledgeArticleFormValues[K]) => {
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
