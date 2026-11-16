export interface ProposalItem {
  id: string
  proposalNumber: string
  title: string
  client: string
  clientEmail?: string
  proposalDate: string
  validUntil: string
  amount: string
  amountNum: number
  deliverables: string[]
  description: string
  status: "Draft" | "Sent" | "Accepted" | "Declined"
}
