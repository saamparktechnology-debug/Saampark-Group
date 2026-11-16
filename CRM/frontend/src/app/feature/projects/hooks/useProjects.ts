import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { deleteProject, getProjects } from "../service/projectService"
import { Project } from "../types"

export const projectsQueryKey = (companyId: string) => ["projects", companyId] as const

export function useProjectsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: projectsQueryKey(companyId),
    queryFn: () => getProjects(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useDeleteProjectMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Project[]>(projectsQueryKey(companyId), (prev = []) =>
        prev.filter((p) => p.id !== id)
      )
    },
  })
}

export function useInvalidateProjects(companyId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: projectsQueryKey(companyId) })
}
