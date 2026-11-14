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

  // 1. Direct ID matching (clientId, client_id, customerId, customer_id, userId, subscriberId, etc.)
  const rClientId = String(record.clientId || record.client_id || record.customerId || record.customer_id || record.userId || record.subscriberId || "").toLowerCase().trim()
  if (rClientId && (rClientId === uId || userEmails.includes(rClientId))) {
    return true
  }

  // 2. Email matching (clientEmail, client_email, email, customerEmail, customer_email, createdByEmail, billedToEmail, etc.)
  const rEmail = String(record.clientEmail || record.client_email || record.email || record.customerEmail || record.customer_email || record.createdByEmail || record.billedToEmail || record.recipientEmail || "").toLowerCase().trim()
  if (rEmail && userEmails.includes(rEmail)) {
    return true
  }

  // Phone matching (if user has phone)
  const uPhone = String(user.phone || "").replace(/[^0-9]/g, "")
  if (uPhone && uPhone.length >= 7) {
    const rPhone = String(record.phone || record.clientPhone || record.client_phone || record.customerPhone || record.customer_phone || "").replace(/[^0-9]/g, "")
    if (rPhone && (rPhone.includes(uPhone) || uPhone.includes(rPhone))) {
      return true
    }
  }

  // 3. Name matching (client, clientName, client_name, customerName, customer_name, customer, companyName, company_name, recipientName, subscriberName, subscriber, billedTo)
  const rClientName = String(
    record.client ||
    record.clientName ||
    record.client_name ||
    record.customerName ||
    record.customer_name ||
    record.customer ||
    record.companyName ||
    record.company_name ||
    record.primaryContact ||
    record.recipientName ||
    record.subscriberName ||
    record.subscriber ||
    record.billedTo ||
    ""
  ).toLowerCase().trim()
  if (rClientName && matchesClientName(rClientName)) {
    return true
  }

  // 4. Project or Sub-object client properties
  if (record.project && typeof record.project === "object") {
    const pClient = String(record.project.client || record.project.clientName || record.project.client_name || "").toLowerCase().trim()
    const pEmail = String(record.project.clientEmail || record.project.client_email || record.project.email || "").toLowerCase().trim()
    const pClientId = String(record.project.clientId || record.project.client_id || "").toLowerCase().trim()
    if (pClientId && (pClientId === uId || userEmails.includes(pClientId))) return true
    if (pEmail && userEmails.includes(pEmail)) return true
    if (pClient && matchesClientName(pClient)) return true
  }

  // Check data_json if present (e.g., from MySQL app_data or salesModel)
  if (record.data_json) {
    try {
      const parsed = typeof record.data_json === "string" ? JSON.parse(record.data_json) : record.data_json
      if (parsed && typeof parsed === "object") {
        if (isRecordAssignedToClient(parsed, user)) return true
      }
    } catch {}
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

/**
 * Checks if a given CRM entity is assigned to or created by the currently logged in Team member.
 * For Super Admin and Admin, returns true (unrestricted company access).
 */
export function isRecordAssignedToTeamMember(
  record: any,
  user?: User | null,
  assignedProjectTitles?: string[]
): boolean {
  if (!user || !record) return false
  const role = (user.role || "").trim()

  // Super Admin & Admin have general company/branch scope, not restricted to individual assignments
  if (role === "Super Admin" || role === "Admin") {
    return true
  }

  // Client scoping is handled separately by isRecordAssignedToClient
  if (role === "Clients" || role === "Client") {
    return isRecordAssignedToClient(record, user)
  }

  // For Team members (Staff, Callers, Developers, etc.):
  const uId = String(user.id || "").toLowerCase().trim()
  const uEmail = (user.email || "").toLowerCase().trim()
  const uName = (user.name || "").toLowerCase().trim()

  // 1. Direct ID matches
  const rAssignedId = String(record.assignedToId || record.assigned_to || record.assigneeId || record.userId || "").toLowerCase().trim()
  const rCreatorId = String(record.createdById || record.created_by || "").toLowerCase().trim()
  if (uId && (rAssignedId === uId || rCreatorId === uId)) return true

  // 2. Email matches
  const rAssignedEmail = String(record.assignedToEmail || record.assigneeEmail || "").toLowerCase().trim()
  const rCreatorEmail = String(record.createdByEmail || "").toLowerCase().trim()
  if (uEmail && (rAssignedEmail === uEmail || rCreatorEmail === uEmail)) return true

  // 3. Name matches (exclude generic admin / super admin strings)
  const rAssigned = String(record.assignedTo || record.assignee || record.caller || "").toLowerCase().trim()
  const rCreator = String(record.createdBy || record.created_by || record.billedBy || "").toLowerCase().trim()
  
  const isSuperAdminStr = (s: string) => s.includes("super admin") || s.includes("(super admin)") || s.includes("(admin)")
  
  if (uName) {
    if (rAssigned && !isSuperAdminStr(rAssigned) && rAssigned === uName) return true
    if (rCreator && !isSuperAdminStr(rCreator) && rCreator === uName) return true
    
    // Multi-word name match
    const uParts = uName.split(/\s+/).filter(Boolean)
    if (uParts.length > 1) {
      if (rAssigned && !isSuperAdminStr(rAssigned)) {
        const aParts = rAssigned.split(/\s+/).filter(Boolean)
        if (aParts.length > 1 && uParts.every(p => aParts.includes(p)) && aParts.every(p => uParts.includes(p))) return true
      }
      if (rCreator && !isSuperAdminStr(rCreator)) {
        const cParts = rCreator.split(/\s+/).filter(Boolean)
        if (cParts.length > 1 && uParts.every(p => cParts.includes(p)) && cParts.every(p => uParts.includes(p))) return true
      }
    }
  }

  // 5. Members / Collaborators array
  const members = Array.isArray(record.members)
    ? record.members
    : Array.isArray(record.collaborators)
    ? record.collaborators
    : []

  if (members.length > 0) {
    const isMember = members.some((m: any) => {
      if (!m) return false
      const mName = String(typeof m === "string" ? m : m.name || "").toLowerCase().trim()
      const mEmail = String(typeof m === "string" ? "" : m.email || "").toLowerCase().trim()
      const mId = String(typeof m === "string" ? "" : m.id || "").toLowerCase().trim()
      return (
        (uId && mId === uId) ||
        (uName && (mName === uName || mName.includes(uName) || uName.includes(mName))) ||
        (uEmail && (mEmail === uEmail || mEmail.includes(uEmail) || uEmail.includes(mEmail)))
      )
    })
    if (isMember) return true
  }

  // 6. Linked Project association
  if (assignedProjectTitles && assignedProjectTitles.length > 0) {
    const pTitle = String(
      (typeof record.project === "string" ? record.project : record.project?.title) ||
      record.projectName ||
      record.projectTitle ||
      ""
    ).toLowerCase().trim()

    if (pTitle && assignedProjectTitles.some((t) => t.toLowerCase().trim() === pTitle)) {
      return true
    }
  }

  return false
}

/**
 * Filter a list of CRM records strictly for Team members to only see items they are assigned to.
 */
export function filterRecordsForTeam<T>(
  records: T[],
  currentUser?: User | null,
  assignedProjectTitles?: string[]
): T[] {
  if (!Array.isArray(records)) return []
  if (!currentUser) return []

  const role = (currentUser.role || "").trim()
  if (role === "Super Admin" || role === "Admin") {
    return records
  }

  if (role === "Clients" || role === "Client") {
    return filterRecordsForClient(records, currentUser)
  }

  // Team member: strictly keep assigned items
  return records.filter((r) => isRecordAssignedToTeamMember(r, currentUser, assignedProjectTitles))
}
