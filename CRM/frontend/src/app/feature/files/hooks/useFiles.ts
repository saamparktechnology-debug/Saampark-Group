import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { fileFeatureService } from "../service/fileService"
import { CloudFileItem } from "../types"

export const filesQueryKey = (companyId: string) => ["files", companyId] as const

export function useFilesQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: filesQueryKey(companyId),
    queryFn: () => fileFeatureService.getAll(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useAddFileMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newFile: CloudFileItem) => {
      const current = queryClient.getQueryData<CloudFileItem[]>(filesQueryKey(companyId)) || []
      const updated = [newFile, ...current]
      await fileFeatureService.saveAll(updated, companyId)
      return updated
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(filesQueryKey(companyId), updated)
    },
  })
}

export function useDeleteFileMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await fileFeatureService.markDeleted(id)
      const current = queryClient.getQueryData<CloudFileItem[]>(filesQueryKey(companyId)) || []
      const updated = current.filter((f) => f.id !== id)
      await fileFeatureService.saveAll(updated, companyId)
      return updated
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(filesQueryKey(companyId), updated)
    },
  })
}
