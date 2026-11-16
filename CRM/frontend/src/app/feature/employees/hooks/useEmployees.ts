import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { QUERY_RESTRICTIONS } from "@/lib/queryOptions"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"
import { employeeFeatureService } from "../service/employeeService"
import { EmployeeFormValues } from "../types"

export const EMPLOYEES_QUERY_KEY = ["employees"] as const
export const EMPLOYEE_DEPARTMENTS_QUERY_KEY = ["employees", "departments"] as const

export function useEmployeesQuery(enabled = true) {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: employeeFeatureService.getAll,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useEmployeeDepartmentsQuery(enabled = true) {
  return useQuery({
    queryKey: EMPLOYEE_DEPARTMENTS_QUERY_KEY,
    queryFn: employeeFeatureService.getDepartments,
    enabled,
    ...QUERY_RESTRICTIONS,
  })
}

export function useSaveEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: EmployeeFormValues }) => {
      return executeWithFeedback(
        async () => (id ? employeeFeatureService.update(id, values) : employeeFeatureService.create(values)),
        {
          actionType: id ? "update" : "create",
          successTitle: id ? "Employee Updated" : "Employee Created",
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return executeWithFeedback(() => employeeFeatureService.remove(id), {
        actionType: "delete",
        successTitle: "Employee Deleted",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY })
    },
  })
}
