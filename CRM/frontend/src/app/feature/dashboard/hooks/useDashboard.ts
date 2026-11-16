import { useQuery } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { getProjects } from "../../projects/service/projectService"
import { getInvoices } from "../../sales/invoices/service/invoiceService"
import { getOrders } from "../../sales/orders/service/orderService"
import { taskService } from "../../tasks/service/taskService"

export function useDashboardProjectsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "projects", companyId],
    queryFn: () => getProjects(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useDashboardTasksQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "tasks", companyId],
    queryFn: () => taskService.getTasks(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useDashboardInvoicesQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "invoices", companyId],
    queryFn: () => getInvoices(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useDashboardOrdersQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "orders", companyId],
    queryFn: () => getOrders(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}
