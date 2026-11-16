import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { taskService } from "../service/taskService"
import { Task } from "../types"

export const tasksQueryKey = (companyId: string) => ["tasks", companyId] as const

export function useTasksQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: tasksQueryKey(companyId),
    queryFn: () => taskService.getTasks(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useUpdateTaskMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskService.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey(companyId) })
    },
  })
}

export function useDeleteTaskMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Task[]>(tasksQueryKey(companyId), (prev = []) =>
        prev.filter((t) => t.id !== id)
      )
    },
  })
}

export function useInvalidateTasks(companyId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: tasksQueryKey(companyId) })
}
