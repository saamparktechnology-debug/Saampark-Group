import { useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { getEvents, getLabels } from "../service/eventService"

export const eventsQueryKey = (companyId: string) => ["events", companyId] as const
export const eventLabelsQueryKey = (companyId: string) => ["event-labels", companyId] as const

export function useEventsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: eventsQueryKey(companyId),
    queryFn: () => getEvents(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useEventLabelsQuery(companyId: string, enabled = true) {
  return useQuery({
    queryKey: eventLabelsQueryKey(companyId),
    queryFn: () => getLabels(companyId),
    enabled: enabled && Boolean(companyId),
    ...QUERY_RESTRICTIONS,
  })
}

export function useInvalidateEvents(companyId: string) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: eventsQueryKey(companyId) })
    queryClient.invalidateQueries({ queryKey: eventLabelsQueryKey(companyId) })
  }
}
