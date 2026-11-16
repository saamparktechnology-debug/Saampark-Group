export interface CloudFileItem {
  id: string
  name: string
  category: string
  linkType: "Google Drive" | "Dropbox" | "OneDrive" | "Cloud Link" | "Direct Upload"
  url: string
  fileSize?: string
  fileExtension?: string
  uploadedBy: string
  uploadedRole: string
  createdAt: string
  notes?: string
}

export interface CloudFileFormValues {
  name: string
  category: string
  linkType: CloudFileItem["linkType"]
  url: string
  fileSize: string
  fileExtension: string
  notes: string
}
