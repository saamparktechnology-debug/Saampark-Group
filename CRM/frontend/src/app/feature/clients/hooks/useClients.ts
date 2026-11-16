import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { getClients } from "../service/clientService"

export const clientsQueryKey = (companyId?: string) =>
  ["clients", companyId || "all"] as const

export function useClientsQuery(companyId?: string, enabled = true) {
  return useQuery({
    queryKey: clientsQueryKey(companyId),
    queryFn: () => getClients(companyId && companyId !== "all" ? companyId : undefined),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateClients(companyId?: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: clientsQueryKey(companyId) })
}
