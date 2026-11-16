export type ReportTab =
  | "revenue"
  | "digital_marketing"
  | "subscriptions"
  | "gst_analytics"
  | "sub_branches"
  | "leads"
  | "productivity"
  | "attendance"
  | "expenses"

export type InvoiceFilterType =
  | "all"
  | "gst"
  | "non_gst"
  | "due"
  | "paid"
  | "partially_paid"

export type SubscriptionFilterType =
  | "all"
  | "package"
  | "regular"
  | "emi"
  | "active"
  | "expiring_soon"
  | "past_due"
  | "canceled"
