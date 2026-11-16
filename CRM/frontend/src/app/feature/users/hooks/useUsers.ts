import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { deleteUser, getUsers, recordUserAccount } from "../service/userService"
import { UserItem } from "../types"

export const USERS_QUERY_KEY = ["users", "all"] as const

export function useUsersQuery(enabled = true) {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => getUsers("all"),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<UserItem>) => recordUserAccount(payload as UserItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    },
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<UserItem[]>(USERS_QUERY_KEY, (prev = []) =>
        prev.filter((u) => u.id !== id)
      )
    },
  })
}

export function useInvalidateUsers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
}
