import * as React from "react"
import { BankAccount, BankAccountFormValues } from "../types"

const EMPTY_FORM: BankAccountFormValues = {
  name: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branch: "",
  status: "Active",
}

export function useBankAccountForm(onSave: (payload: { id?: string; values: BankAccountFormValues }) => Promise<unknown>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<BankAccount | null>(null)
  const [values, setValues] = React.useState<BankAccountFormValues>(EMPTY_FORM)

  const openAdd = React.useCallback(() => {
    setEditingItem(null)
    setValues(EMPTY_FORM)
    setIsOpen(true)
  }, [])

  const openEdit = React.useCallback((item: BankAccount) => {
    setEditingItem(item)
    setValues({
      name: item.name,
      bankName: item.bankName,
      accountNumber: item.accountNumber,
      ifscCode: item.ifscCode,
      branch: item.branch || "",
      status: item.status,
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  const updateField = React.useCallback(<K extends keyof BankAccountFormValues>(key: K, value: BankAccountFormValues[K]) => {
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
