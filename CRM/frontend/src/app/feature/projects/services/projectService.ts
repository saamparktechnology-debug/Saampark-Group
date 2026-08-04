import { Project } from "../types"

const MOCK_PROJECTS: Project[] = [
  { id: "PRJ-101", name: "Website Redesign", client: "Acme Corp", status: "In Progress", deadline: "2026-09-15", progress: 65, budget: "₹4,20,000" },
  { id: "PRJ-102", name: "Mobile App V2", client: "TechNova", status: "Planning", deadline: "2026-11-01", progress: 10, budget: "₹8,50,000" },
  { id: "PRJ-103", name: "Marketing Campaign", client: "Global Industries", status: "Review", deadline: "2026-08-10", progress: 95, budget: "₹1,80,000" },
  { id: "PRJ-104", name: "Server Migration", client: "Wayne Tech", status: "Completed", deadline: "2026-07-28", progress: 100, budget: "₹3,40,000" },
  { id: "PRJ-105", name: "CRM Integration", client: "Stark Enterprises", status: "Planning", deadline: "2026-10-30", progress: 5, budget: "₹12,00,000" },
  { id: "PRJ-106", name: "ERP System", client: "Patel & Associates", status: "In Progress", deadline: "2026-12-15", progress: 40, budget: "₹25,00,000" },
]

export const getProjects = async (): Promise<Project[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_PROJECTS)
    }, 500)
  })
}
