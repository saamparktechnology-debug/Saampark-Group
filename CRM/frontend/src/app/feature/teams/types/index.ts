export interface TeamMember {
  id: string
  name: string
  role?: string
  avatar?: string
}

export interface Team {
  id: string
  name: string
  description?: string
  lead?: string
  memberCount?: number
  members?: TeamMember[]
  status?: string
}

export interface TeamFormValues {
  name: string
  description: string
  lead: string
}
