import { BranchApiService, SubBranchApiService } from "@/app/feature/companies/service/companyService"

export const branchFeatureService = {
  async getBranches(companyId = "all") {
    return BranchApiService.getAll(companyId)
  },
  async getSubBranches(branchId = "all") {
    return SubBranchApiService.getAll(branchId)
  },
}
