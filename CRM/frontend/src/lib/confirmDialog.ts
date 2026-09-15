/**
 * Universal Two-Step Confirmation for Delete Actions
 * Enforces a mandatory second confirmation prompt before any item is deleted.
 */

export async function confirmTwoStepDelete(itemName: string, itemType = "record"): Promise<boolean> {
  if (typeof window === "undefined") return false

  const displayName = itemName ? `"${itemName}"` : `this ${itemType}`

  // Step 1: Initial Confirmation
  const firstConfirm = window.confirm(
    `Are you sure you want to delete ${itemType} ${displayName}?`
  )
  if (!firstConfirm) return false

  // Step 2: Mandatory Second Confirmation
  const secondConfirm = window.confirm(
    `⚠️ 2nd CONFIRMATION REQUIRED:\n\nAre you ABSOLUTELY sure you want to permanently delete ${displayName}?\n\nThis action cannot be undone and will permanently remove all associated invoices, projects, payments, and report records.`
  )
  return secondConfirm
}

export async function confirmTwoStepBulkDelete(count: number, itemType = "records"): Promise<boolean> {
  if (typeof window === "undefined" || count <= 0) return false

  // Step 1: Initial Bulk Confirmation
  const firstConfirm = window.confirm(
    `Are you sure you want to delete ${count} selected ${itemType}?`
  )
  if (!firstConfirm) return false

  // Step 2: Mandatory Second Confirmation
  const secondConfirm = window.confirm(
    `⚠️ 2nd CONFIRMATION REQUIRED:\n\nAre you ABSOLUTELY sure you want to permanently delete these ${count} ${itemType}?\n\nThis action cannot be undone and will permanently remove all associated records from reports and database.`
  )
  return secondConfirm
}
