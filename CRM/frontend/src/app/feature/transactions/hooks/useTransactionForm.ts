import * as React from "react"
import { TransactionFormValues } from "../types"

export function useTransactionForm(onCreate: (values: TransactionFormValues) => Promise<unknown>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [values, setValues] = React.useState<TransactionFormValues>({
    number: "",
    type: "Income",
    category: "Sales",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    method: "Bank Transfer",
    notes: "",
  })

  const openAdd = React.useCallback(() => {
    setValues({
      number: `TXN-${Date.now().toString().slice(-6)}`,
      type: "Income",
      category: "Sales",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      method: "Bank Transfer",
      notes: "",
    })
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => setIsOpen(false), [])

  const updateField = React.useCallback(
    <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (values.amount <= 0) return
      await onCreate(values)
      setIsOpen(false)
    },
    [onCreate, values]
  )

  return { isOpen, values, openAdd, close, updateField, handleSubmit }
}
