export type DepartmentTab = "departments" | "designations"

export interface Department {
  id: string
  name: string
  code?: string
  head?: string
  memberCount?: number
  status: string
}

export interface Designation {
  id: string
  name: string
  level?: string
  status: string
}

export interface DepartmentFormValues {
  name: string
  code: string
  head: string
  level: string
}
