export type { ModuleActionFlags } from "@/store/usePermissionStore"

export interface RolePermissionRecord {
  id: string
  role: string
  permissions: Record<string, Record<string, boolean>>
}
