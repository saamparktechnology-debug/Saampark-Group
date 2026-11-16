import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { permissionFeatureService } from "../service/permissionService"

export const PERMISSIONS_QUERY_KEY = ["permissions"] as const

export function usePermissionsQuery(enabled = true) {
  return useQuery({
    queryKey: PERMISSIONS_QUERY_KEY,
    queryFn: permissionFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidatePermissions() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEY })
}
