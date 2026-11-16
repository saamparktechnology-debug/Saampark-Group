import {
  approveApprovalRequest,
  deleteApprovalRequest,
  getApprovalRequests,
  rejectApprovalRequest,
  ApprovalRequest,
} from "@/services/approvalService"

export const approvalFeatureService = {
  async getAll(companyId: string): Promise<ApprovalRequest[]> {
    const data = await getApprovalRequests(companyId || "all")
    return Array.isArray(data) ? data : []
  },

  async approve(id: string, reviewerName: string) {
    return approveApprovalRequest(id, reviewerName)
  },

  async reject(id: string, reviewerName: string, reason: string) {
    return rejectApprovalRequest(id, reviewerName, reason)
  },

  async remove(id: string) {
    return deleteApprovalRequest(id)
  },
}
