import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { noteFeatureService } from "../service/noteService"
import { NoteItem } from "../types"

export const notesQueryKey = (companyId: string) => ["notes", companyId] as const

export function useNotesQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: notesQueryKey(companyId),
    queryFn: () => noteFeatureService.getAll(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveNotesMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updated: NoteItem[]) => {
      await noteFeatureService.saveAll(updated, companyId)
      return updated
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(notesQueryKey(companyId), updated)
    },
  })
}

export function useDeleteNoteMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await noteFeatureService.markDeleted(id)
      const current = queryClient.getQueryData<NoteItem[]>(notesQueryKey(companyId)) || []
      const updated = current.filter((n) => n.id !== id)
      await noteFeatureService.saveAll(updated, companyId)
      return updated
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(notesQueryKey(companyId), updated)
    },
  })
}
