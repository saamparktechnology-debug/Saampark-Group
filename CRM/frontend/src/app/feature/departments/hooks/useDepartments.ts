import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { departmentFeatureService } from "../service/departmentService"
import { DepartmentFormValues, DepartmentTab } from "../types"

export const DEPARTMENTS_QUERY_KEY = ["departments"] as const
export const DESIGNATIONS_QUERY_KEY = ["designations"] as const

export function useDepartmentsQuery(enabled = true) {
  return useQuery({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: departmentFeatureService.getDepartments,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useDesignationsQuery(enabled = true) {
  return useQuery({
    queryKey: DESIGNATIONS_QUERY_KEY,
    queryFn: departmentFeatureService.getDesignations,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveDepartmentMutation(activeTab: DepartmentTab) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: DepartmentFormValues }) => {
      if (activeTab === "departments") {
        const data = { name: values.name, code: values.code, head: values.head, status: "Active" }
        return executeWithFeedback(
          async () => (id ? departmentFeatureService.updateDepartment(id, data) : departmentFeatureService.createDepartment(data)),
          { actionType: id ? "update" : "create", successTitle: id ? "Department Updated" : "Department Created" }
        )
      }

      const data = { name: values.name, level: values.level, status: "Active" }
      return executeWithFeedback(
        async () => (id ? departmentFeatureService.updateDesignation(id, data) : departmentFeatureService.createDesignation(data)),
        { actionType: id ? "update" : "create", successTitle: id ? "Designation Updated" : "Designation Created" }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: activeTab === "departments" ? DEPARTMENTS_QUERY_KEY : DESIGNATIONS_QUERY_KEY,
      })
    },
  })
}

export function useDeleteDepartmentMutation(activeTab: DepartmentTab) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(
        async () => (activeTab === "departments" ? departmentFeatureService.deleteDepartment(id) : departmentFeatureService.deleteDesignation(id)),
        { actionType: "delete", successTitle: "Deleted" }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: activeTab === "departments" ? DEPARTMENTS_QUERY_KEY : DESIGNATIONS_QUERY_KEY,
      })
    },
  })
}
