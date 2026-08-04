export type Client = {
  id: string
  name: string
  email: string
  status: "Active" | "Inactive" | "Lead"
  projects: number
  amount: string
}
