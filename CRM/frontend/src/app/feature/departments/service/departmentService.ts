import { OrgService } from "@/services/orgService"
import { Department, Designation } from "../types"

export const departmentFeatureService = {
  async getDepartments(): Promise<Department[]> {
    const data = await OrgService.getDepartments()
    return Array.isArray(data) ? data : []
  },

  async getDesignations(): Promise<Designation[]> {
    const data = await OrgService.getDesignations()
    return Array.isArray(data) ? data : []
  },

  async createDepartment(data: Omit<Department, "id">) {
    return OrgService.createDepartment(data)
  },

  async updateDepartment(id: string, data: Omit<Department, "id">) {
    return OrgService.updateDepartment(id, data)
  },

  async deleteDepartment(id: string) {
    return OrgService.deleteDepartment(id)
  },

  async createDesignation(data: Omit<Designation, "id">) {
    return OrgService.createDesignation(data)
  },

  async updateDesignation(id: string, data: Omit<Designation, "id">) {
    return OrgService.updateDesignation(id, data)
  },

  async deleteDesignation(id: string) {
    return OrgService.deleteDesignation(id)
  },
}
