export interface FollowUp {
  id: string
  subject: string
  type?: string
  scheduledDate?: string
  status: string
  assignedTo?: string
  notes?: string
}

export interface FollowUpFormValues {
  subject: string
  type: string
  scheduledDate: string
  status: string
  assignedTo: string
  notes: string
}
