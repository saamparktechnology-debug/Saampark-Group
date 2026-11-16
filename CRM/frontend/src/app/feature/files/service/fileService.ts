import {
  fetchModuleDataFromDB,
  filterGlobalDeletedItems,
  markGlobalItemDeleted,
  saveModuleDataToDB,
} from "@/lib/storageSync"
import { CloudFileItem } from "../types"

export const fileFeatureService = {
  async getAll(companyId: string): Promise<CloudFileItem[]> {
    const data = await fetchModuleDataFromDB<CloudFileItem[]>("cloud_files", [], companyId)
    return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
  },

  async saveAll(files: CloudFileItem[], companyId: string): Promise<void> {
    await saveModuleDataToDB("cloud_files", files, companyId)
  },

  async markDeleted(id: string): Promise<void> {
    await markGlobalItemDeleted(id, "cloud_files")
  },
}
