export interface DashboardKPI {
  title: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
}
