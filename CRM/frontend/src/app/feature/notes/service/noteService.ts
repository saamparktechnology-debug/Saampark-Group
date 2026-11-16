import {
  fetchModuleDataFromDB,
  filterGlobalDeletedItems,
  markGlobalItemDeleted,
  saveModuleDataToDB,
} from "@/lib/storageSync"
import { NoteItem } from "../types"

export const noteFeatureService = {
  async getAll(companyId: string): Promise<NoteItem[]> {
    const data = await fetchModuleDataFromDB<NoteItem[]>("notes", [], companyId)
    return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
  },

  async saveAll(notes: NoteItem[], companyId: string): Promise<void> {
    await saveModuleDataToDB("notes", notes, companyId)
  },

  async markDeleted(id: string): Promise<void> {
    await markGlobalItemDeleted(id, "notes")
  },
}
