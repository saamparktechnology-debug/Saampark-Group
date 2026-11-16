import { EmployeeService, OrgService } from "@/services/hrService"
import { DepartmentOption, Employee, EmployeeFormValues } from "../types"

export const employeeFeatureService = {
  async getAll(): Promise<Employee[]> {
    const data = await EmployeeService.getAll({})
    return Array.isArray(data) ? data : []
  },

  async getDepartments(): Promise<DepartmentOption[]> {
    const data = await OrgService.getDepartments()
    return Array.isArray(data) ? data : []
  },

  async create(payload: EmployeeFormValues): Promise<Employee> {
    return EmployeeService.create(payload)
  },

  async update(id: string, payload: EmployeeFormValues): Promise<Employee> {
    return EmployeeService.update(id, payload)
  },

  async remove(id: string): Promise<void> {
    return EmployeeService.delete(id)
  },
}
