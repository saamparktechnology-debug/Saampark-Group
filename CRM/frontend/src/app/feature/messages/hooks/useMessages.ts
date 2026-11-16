import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { messageFeatureService } from "../service/messageService"
import { ChatMessage } from "../types"

export const messagesQueryKey = (companyId: string) => ["messages", companyId] as const

export function useMessagesQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: messagesQueryKey(companyId),
    queryFn: () => messageFeatureService.getAll(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveMessagesMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updated: ChatMessage[]) => {
      await messageFeatureService.saveAll(updated, companyId)
      return updated
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(messagesQueryKey(companyId), updated)
    },
  })
}
