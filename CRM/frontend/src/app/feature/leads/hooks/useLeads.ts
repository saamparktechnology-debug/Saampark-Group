import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { deleteLead, getLeads, updateLead } from "../service/leadService"
import { Lead } from "../types"

export const leadsQueryKey = (companyId: string) => ["leads", companyId] as const

export function useLeadsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: leadsQueryKey(companyId),
    queryFn: () => getLeads(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useUpdateLeadMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) =>
      updateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKey(companyId) })
    },
  })
}

export function useDeleteLeadMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Lead[]>(leadsQueryKey(companyId), (prev = []) =>
        prev.filter((l) => l.id !== id)
      )
    },
  })
}

export function useInvalidateLeads(companyId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: leadsQueryKey(companyId) })
}
