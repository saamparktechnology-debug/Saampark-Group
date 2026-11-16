import { useQuery } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { attendanceFeatureService } from "../service/attendanceService"

export const attendanceQueryKey = (monthKey: string) => ["attendance", monthKey] as const

export function useAttendanceQuery(monthKey: string, enabled = true) {
  return useQuery({
    queryKey: attendanceQueryKey(monthKey),
    queryFn: () => attendanceFeatureService.getAll({ month: monthKey }),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}
