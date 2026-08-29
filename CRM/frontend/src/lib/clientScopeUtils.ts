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
  const uCompName = String((user as any).companyName || (user as any).company || "").toLowerCase().trim()

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

  // Helper to check if string matches client user name or client company name
  const matchesClientName = (target: string) => {
    if (!target) return false
    const t = target.toLowerCase().trim()
    if (uName && (t === uName || t.includes(uName) || uName.includes(t))) return true
    if (uCompName && (t === uCompName || t.includes(uCompName) || uCompName.includes(t))) return true
    return false
  }

  // 1. Direct ID matching (clientId, client_id, customerId, userId, subscriberId, etc.)
  const rClientId = String(record.clientId || record.client_id || record.customerId || record.customer_id || record.userId || record.subscriberId || "").toLowerCase().trim()
  if (rClientId && (rClientId === uId || userEmails.includes(rClientId))) {
    return true
  }

  // 2. Email matching (clientEmail, client_email, email, customerEmail, createdByEmail, billedToEmail, etc.)
  const rEmail = String(record.clientEmail || record.client_email || record.email || record.customerEmail || record.createdByEmail || record.billedToEmail || record.recipientEmail || "").toLowerCase().trim()
  if (rEmail && userEmails.includes(rEmail)) {
    return true
  }

  // 3. Name matching (client, clientName, customerName, customer, recipientName, subscriberName, subscriber)
  const rClientName = String(record.client || record.clientName || record.customerName || record.customer || record.recipientName || record.subscriberName || record.subscriber || record.billedTo || "").toLowerCase().trim()
  if (rClientName && matchesClientName(rClientName)) {
    return true
  }

  // 4. Project or Sub-object client properties
  if (record.project && typeof record.project === "object") {
    const pClient = String(record.project.client || record.project.clientName || "").toLowerCase().trim()
    const pEmail = String(record.project.clientEmail || record.project.email || "").toLowerCase().trim()
    const pClientId = String(record.project.clientId || record.project.client_id || "").toLowerCase().trim()
    if (pClientId && (pClientId === uId || userEmails.includes(pClientId))) return true
    if (pEmail && userEmails.includes(pEmail)) return true
    if (pClient && matchesClientName(pClient)) return true
  }

  // 5. Creator matching (if client created the record themselves)
  const cEmail = String(record.createdByEmail || "").toLowerCase().trim()
  const cId = String(record.createdById || "").toLowerCase().trim()
  if (cEmail && userEmails.includes(cEmail)) return true
  if (cId && cId === uId) return true

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
