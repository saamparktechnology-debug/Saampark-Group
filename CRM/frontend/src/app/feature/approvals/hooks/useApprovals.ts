import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { approvalFeatureService } from "../service/approvalService"

export const approvalsQueryKey = (companyId: string) => ["approvals", companyId] as const

export function useApprovalsQuery(companyId: string, enabled = true) {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: approvalsQueryKey(companyId) })
    }
    window.addEventListener("saampark_approvals_updated", handleUpdate)
    return () => {
      window.removeEventListener("saampark_approvals_updated", handleUpdate)
    }
  }, [companyId, queryClient])

  return useQuery({
    queryKey: approvalsQueryKey(companyId),
    queryFn: () => approvalFeatureService.getAll(companyId),
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useApproveRequestMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reviewerName }: { id: string; reviewerName: string }) =>
      approvalFeatureService.approve(id, reviewerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalsQueryKey(companyId) })
    },
  })
}

export function useRejectRequestMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reviewerName, reason }: { id: string; reviewerName: string; reason: string }) =>
      approvalFeatureService.reject(id, reviewerName, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalsQueryKey(companyId) })
    },
  })
}

export function useDeleteApprovalMutation(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => approvalFeatureService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalsQueryKey(companyId) })
    },
  })
}
