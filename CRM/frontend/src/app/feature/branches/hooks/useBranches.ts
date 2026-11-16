import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { branchFeatureService } from "../service/branchService"

export const BRANCHES_QUERY_KEY = ["branches"] as const
export const SUB_BRANCHES_QUERY_KEY = ["sub-branches"] as const

export function useBranchesQuery(companyId = "all", enabled = true) {
  return useQuery({
    queryKey: [...BRANCHES_QUERY_KEY, companyId],
    queryFn: () => branchFeatureService.getBranches(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSubBranchesQuery(branchId = "all", enabled = true) {
  return useQuery({
    queryKey: [...SUB_BRANCHES_QUERY_KEY, branchId],
    queryFn: () => branchFeatureService.getSubBranches(branchId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateBranches() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: SUB_BRANCHES_QUERY_KEY })
  }
}
