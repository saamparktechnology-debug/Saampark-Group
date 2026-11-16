import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { BranchApiService, CompanyApiService } from "../service/companyService"

export const COMPANIES_QUERY_KEY = ["companies"] as const
export const COMPANY_BRANCHES_QUERY_KEY = ["companies", "branches"] as const

export function useCompaniesQuery(enabled = true) {
  return useQuery({
    queryKey: COMPANIES_QUERY_KEY,
    queryFn: () => CompanyApiService.getAll().catch(() => []),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useCompanyBranchesQuery(enabled = true) {
  return useQuery({
    queryKey: COMPANY_BRANCHES_QUERY_KEY,
    queryFn: () => BranchApiService.getAll("all").catch(() => []),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateCompanies() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: COMPANY_BRANCHES_QUERY_KEY })
  }
}
