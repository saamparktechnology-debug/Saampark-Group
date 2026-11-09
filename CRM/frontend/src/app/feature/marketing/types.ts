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
  views: number   // 8500
  reach: number   // 6100
  leads: number   // 120
  postUrl?: string
  notes?: string
}

export interface MarketingCampaign {
  id: string
  clientId: string
  clientName: string
  clientEmail?: string
  clientAvatar?: string
  companyId: string
  branchName?: string
  packageName: string // "Premium Digital Package"
  packageDurationMonths: number // 3
  startDate: string // "2026-10-01"
  endDate: string   // "2027-01-31"
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
