import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { ticketFeatureService } from "../service/ticketService"
import { DisputeTicket } from "../types"

export const ticketsQueryKey = (companyId: string) => ["tickets", companyId] as const

export function useTicketsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ticketsQueryKey(companyId),
    queryFn: () => ticketFeatureService.getAll(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveTicketsMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updated: DisputeTicket[]) => {
      await ticketFeatureService.saveAll(updated, companyId)
      return updated
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(ticketsQueryKey(companyId), updated)
    },
  })
}

export function useDeleteTicketMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await ticketFeatureService.markDeleted(id)
      const current = queryClient.getQueryData<DisputeTicket[]>(ticketsQueryKey(companyId)) || []
      const updated = current.filter((t) => t.id !== id)
      await ticketFeatureService.saveAll(updated, companyId)
      return updated
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(ticketsQueryKey(companyId), updated)
    },
  })
}
