export type NoteColor = "pink" | "orange" | "blue" | "green" | "yellow" | "purple"
export type NoteVisibility = "public" | "private"

export interface NoteItem {
  id: string
  title: string
  content: string
  category: string
  color: NoteColor
  visibility: NoteVisibility
  isImportant?: boolean
  createdAt: string
  createdBy: string
  createdRole: string
}
