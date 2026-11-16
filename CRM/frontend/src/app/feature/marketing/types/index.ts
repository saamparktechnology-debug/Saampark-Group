export type MarketingServiceType = "Poster" | "Video" | "Real Model Video" | "Tutor Service" | "Custom Service"

export interface MarketingServiceQuota {
  serviceKey: string // "poster", "video", "real_model", "custom"
  serviceName: MarketingServiceType | string
  commitment: number  // e.g. 20
  posted: number      // e.g. 18
  views: number       // e.g. 78500
  reach: number       // e.g. 62100
  leads: number       // e.g. 420
  thumbnailUrl?: string
}

export interface MarketingPost {
  id: string
  campaignId: string
  clientId: string
  clientName: string
  service: string // "Poster" | "Video" | "Real Model Video" | "Tutor Service"
  title: string   // "Diwali Special Offer"
  contentPreview?: string // image / thumbnail URL
  publishedAt: string // "31 Oct, 05:30 PM"
  status: "Posted" | "Scheduled" | "In Review" | "Draft"
  platform?: "Meta" | "Instagram" | "Facebook" | "YouTube" | "LinkedIn"
  views: number   // 8500
  likes?: number   // 1240
  shares?: number  // 180
  reach: number   // 6100
  leads: number   // 120
  postUrl?: string // Real Live Meta/Social Media Link
  notes?: string
}

export type MarketingStage = "Pending" | "Action" | "Completed"

export interface MarketingCampaign {
  id: string
  clientId: string
  clientName: string
  clientEmail?: string
  clientAvatar?: string
  companyId: string
  branchId?: string
  branchName?: string
  subBranchId?: string
  subBranchName?: string
  assignedMemberId?: string
  assignedMemberName?: string
  assignedMemberEmail?: string
  createdBy?: string
  invoiceId?: string
  packageName: string // "Premium Digital Package"
  packageDurationMonths: number // 3
  startDate: string // "2026-10-01"
  endDate: string   // "2027-01-31"
  stage?: MarketingStage // "Pending" -> "Action" (after 1st post) -> "Completed"
  status: "Active" | "Completed" | "Paused"
  totalCommitment: number // 68
  totalPosted: number     // 52
  totalLeads: number      // 450
  services: Record<string, MarketingServiceQuota>
}

export interface MarketingLead {
  id: string
  campaignId: string
  clientId: string
  name: string
  phone: string
  email?: string
  source: string // "Meta Ads" | "Google Ads" | "WhatsApp"
  campaignName: string
  capturedAt: string
  status: "New" | "Contacted" | "Converted"
}

