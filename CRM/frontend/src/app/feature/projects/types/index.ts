export type Project = {
  id: string
  name: string
  client: string
  status: "Planning" | "In Progress" | "Review" | "Completed"
  deadline: string
  progress: number
  budget: string
}
