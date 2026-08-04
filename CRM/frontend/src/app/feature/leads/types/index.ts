export type Lead = {
  id: string
  name: string
  primaryContact: string
  phone: string
  owner: string
  value: string
  createdAt: string
  status: "New" | "Negotiation" | "Discussion" | "Qualified" | "Won" | "Lost"
}
