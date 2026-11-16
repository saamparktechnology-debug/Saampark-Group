import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { proposalFeatureService } from "../service/proposalService"
import { ProposalItem } from "../types"

export const proposalsQueryKey = (companyId: string) => ["proposals", companyId] as const

export function useProposalsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: proposalsQueryKey(companyId),
    queryFn: () => proposalFeatureService.getAll(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveProposalsMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updated: ProposalItem[]) => {
      await proposalFeatureService.saveAll(updated, companyId)
      return updated
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(proposalsQueryKey(companyId), updated)
    },
  })
}

export function useDeleteProposalMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await proposalFeatureService.markDeleted(id)
      const current = queryClient.getQueryData<ProposalItem[]>(proposalsQueryKey(companyId)) || []
      const updated = current.filter((p) => p.id !== id)
      await proposalFeatureService.saveAll(updated, companyId)
      return updated
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(proposalsQueryKey(companyId), updated)
    },
  })
}
