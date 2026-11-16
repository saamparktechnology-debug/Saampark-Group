import { useQuery } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { MarketingService } from "../service/marketingService"

export const marketingCampaignsQueryKey = (companyId: string) =>
  ["marketing", "campaigns", companyId] as const

export function useMarketingCampaignsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: marketingCampaignsQueryKey(companyId),
    queryFn: () => MarketingService.getCampaigns(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}
