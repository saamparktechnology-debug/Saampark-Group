export interface Enquiry {
  id: string
  subject: string
  source?: string
  priority?: string
  status: string
  assignedTo?: string
  createdAt?: string
  notes?: string
}

export interface EnquiryFormValues {
  subject: string
  source: string
  priority: string
  status: string
  assignedTo: string
  notes: string
}
