export type LeadStatus =
  | "New"
  | "Qualified"
  | "Discussion"
  | "Negotiation"
  | "Store Visit"
  | "They come to our office"
  | "Won"
  | "Lost"

export type LeadType = "Organization" | "Person"

export interface Lead {
  id: string
  type: LeadType
  name: string
  primaryContact: string
  phone: string
  email?: string
  owner: string
  caller?: string
  createdBy?: string
  ownerAvatar?: string
  service?: string
  reminderDate?: string
  reminderTime?: string
  reminderNotes?: string
  labels: string[]
  createdAt: string
  status: LeadStatus
  source: string
  probability?: number
  value?: string
  managers?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  website?: string
  vatNumber?: string
  gstNumber?: string
  currency?: string
  isLocked?: boolean
  lockedReason?: string
  assignedTo?: string
  assigned_to?: string | number
}
