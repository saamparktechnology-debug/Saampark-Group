import { useQuery } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { getInvoices } from "../invoices/service/invoiceService"
import { getOrders } from "../orders/service/orderService"
import { getPayments } from "../payments/service/paymentService"

export function useSalesInvoicesQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ["sales", "invoices", companyId],
    queryFn: () => getInvoices(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSalesOrdersQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ["sales", "orders", companyId],
    queryFn: () => getOrders(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSalesPaymentsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ["sales", "payments", companyId],
    queryFn: () => getPayments(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}
