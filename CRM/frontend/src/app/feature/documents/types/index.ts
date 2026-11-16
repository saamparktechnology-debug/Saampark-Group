export interface DocumentItem {
  id: string
  name: string
  category: string
  type: string
  size: string
  expiry?: string
  uploadedBy: string
  uploadedAt: string
}

export interface DocumentFormValues {
  name: string
  category: string
  type: string
  size: string
  expiry: string
  uploadedBy: string
}
