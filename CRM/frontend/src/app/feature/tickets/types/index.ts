export type TicketPriority = "Low" | "Normal" | "High" | "Critical"
export type TicketStatus =
  | "New"
  | "Open"
  | "In Progress"
  | "Under Review"
  | "Resolved"
  | "Closed"

export interface TicketAttachment {
  name: string
  url: string
  size?: string
}

export interface DisputeTicket {
  id: string
  ticketNumber: string
  subject: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  description: string
  attachments?: TicketAttachment[]
  createdBy: string
  creatorEmail: string
  creatorRole: string
  companyId?: string
  branchId?: string
  createdAt: string
  assignedTo?: string
  raisedTo?: string
  resolutionNote?: string
  resolutionAttachments?: TicketAttachment[]
  resolvedAt?: string
  resolvedBy?: string
}
