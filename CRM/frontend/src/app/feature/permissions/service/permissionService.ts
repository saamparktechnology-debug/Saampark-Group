import { PermissionService } from "@/services/permissionService"

export const permissionFeatureService = {
  async getAll() {
    return PermissionService.getAll()
  },
}
