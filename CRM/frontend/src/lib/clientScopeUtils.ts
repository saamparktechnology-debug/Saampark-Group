import { User } from "@/store/useAuthStore"

/**
 * Checks if a given CRM entity (project, invoice, subscription, proposal, estimate, ticket, etc.)
 * belongs to the currently logged in Client user.
 */
export function isRecordAssignedToClient(record: any, user?: User | null): boolean {
  if (!user || !record) return false
  if (user.role !== "Clients" && (user.role as string) !== "Client") {
    // If not a client (Super Admin, Admin, Teams), return true (let standard company/branch filters apply)
    return true
  }

  const uId = String(user.id || "").toLowerCase().trim()
  const uEmail = (user.email || "").toLowerCase().trim()
  const uName = (user.name || "").toLowerCase().trim()

  // Collect all known aliases for the user (including previous emails)
  const userEmails: string[] = [uEmail]
  if (Array.isArray((user as any).previousEmails)) {
    (user as any).previousEmails.forEach((pe: string) => {
      if (pe && !userEmails.includes(pe.toLowerCase().trim())) {
        userEmails.push(pe.toLowerCase().trim())
      }
    })
  }
  if ((user as any).previousEmail && !userEmails.includes((user as any).previousEmail.toLowerCase().trim())) {
    userEmails.push((user as any).previousEmail.toLowerCase().trim())
  }

  // 1. Direct ID matching (clientId, client_id, customerId, userId)
  const rClientId = String(record.clientId || record.client_id || record.customerId || record.customer_id || record.userId || "").toLowerCase().trim()
  if (rClientId && (rClientId === uId || userEmails.includes(rClientId))) {
    return true
  }

  // 2. Email matching (clientEmail, client_email, email, customerEmail, createdByEmail)
  const rEmail = String(record.clientEmail || record.client_email || record.email || record.customerEmail || record.createdByEmail || "").toLowerCase().trim()
  if (rEmail && userEmails.includes(rEmail)) {
    return true
  }

  // 3. Name matching (client, clientName, customerName, customer, recipientName)
  const rClientName = String(record.client || record.clientName || record.customerName || record.customer || record.recipientName || "").toLowerCase().trim()
  if (rClientName && uName) {
    if (rClientName === uName || rClientName.includes(uName) || uName.includes(rClientName)) {
      return true
    }
  }

  // 4. Project or Sub-object client properties
  if (record.project && typeof record.project === "object") {
    const pClient = String(record.project.client || record.project.clientName || "").toLowerCase().trim()
    const pEmail = String(record.project.clientEmail || record.project.email || "").toLowerCase().trim()
    if (pEmail && userEmails.includes(pEmail)) return true
    if (pClient && uName && (pClient === uName || pClient.includes(uName) || uName.includes(pClient))) return true
  }

  return false
}

/**
 * Filter a list of CRM records to ensure strict Client-level data isolation.
 */
export function filterRecordsForClient<T>(
  records: T[],
  currentUser?: User | null
): T[] {
  if (!Array.isArray(records)) return []
  if (!currentUser) return []

  // If user is a Client, strictly keep only records belonging to them
  if (currentUser.role === "Clients" || (currentUser.role as string) === "Client") {
    return records.filter((r) => isRecordAssignedToClient(r, currentUser))
  }

  // Non-client roles return the original array (to be filtered by active company/branch)
  return records
}
