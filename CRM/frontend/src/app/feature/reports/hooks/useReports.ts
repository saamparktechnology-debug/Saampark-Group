import { useQuery } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { reportFeatureService } from "../service/reportService"

export function useReportInvoicesQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ["reports", "invoices", companyId],
    queryFn: () => reportFeatureService.getInvoices(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useReportPaymentsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ["reports", "payments", companyId],
    queryFn: () => reportFeatureService.getPayments(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}
