export type LetterType = 
  | "offer_letter" 
  | "office_close" 
  | "appointment" 
  | "experience" 
  | "warning" 
  | "announcement" 
  | "custom"

export interface LetterRecipient {
  id: string
  name: string
  email: string
  role?: string
  type: "team" | "client"
  avatarUrl?: string
  branchName?: string
  phone?: string
  companyName?: string
}

export interface LetterCustomFields {
  // Offer Letter
  candidateName?: string
  jobTitle?: string
  department?: string
  ctcAmount?: string
  joiningDate?: string
  probationMonths?: string
  workLocation?: string
  
  // Office Close / Holiday Notice
  noticeTitle?: string
  closedFromDate?: string
  closedToDate?: string
  resumptionDate?: string
  occasion?: string
  emergencyContact?: string
  isWorkFromHomeAllowed?: boolean
  
  // Experience / Relieving Letter
  relievingDate?: string
  tenureDuration?: string
  conductRating?: string
  
  // Appointment Letter
  reportingManager?: string
  workingHours?: string
  
  // Warning Letter
  incidentDate?: string
  violationReason?: string
  remedialActionPeriod?: string
}

export interface LetterRecord {
  id: string
  referenceNumber: string
  companyId: string
  companyName?: string
  templateType: LetterType
  title: string
  subject: string
  body: string
  customFields?: LetterCustomFields
  recipients: LetterRecipient[]
  recipientType: "team" | "client" | "both"
  signatoryName?: string
  signatoryDesignation?: string
  signatureUrl?: string
  stampUrl?: string
  createdAt: string
  createdBy: string
  status: "Sent" | "Draft"
}
