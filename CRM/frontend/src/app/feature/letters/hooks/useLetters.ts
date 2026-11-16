import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { deleteLetter, getLetters } from "../service/letterService"
import { LetterRecord } from "../types"

export const lettersQueryKey = (companyId: string) => ["letters", companyId] as const

export function useLettersQuery(companyId: string, enabled = true) {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    const handleCreated = () => {
      queryClient.invalidateQueries({ queryKey: lettersQueryKey(companyId) })
    }
    window.addEventListener("saampark_letter_created", handleCreated)
    return () => window.removeEventListener("saampark_letter_created", handleCreated)
  }, [companyId, queryClient])

  return useQuery({
    queryKey: lettersQueryKey(companyId),
    queryFn: () => getLetters(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useDeleteLetterMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteLetter(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<LetterRecord[]>(lettersQueryKey(companyId), (prev = []) =>
        prev.filter((l) => l.id !== id)
      )
    },
  })
}
