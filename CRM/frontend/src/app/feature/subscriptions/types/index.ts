export type Subscription = {
  id: string
  clientName: string
  planName: string
  status: "Active" | "Past Due" | "Canceled" | "Trial"
  amount: string
  billingCycle: "Monthly" | "Annually" | "Quarterly"
  nextBillingDate: string
}
