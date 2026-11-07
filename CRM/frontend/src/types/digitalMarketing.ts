"use client"

export type MarketingPlanDuration =
  | "Weekly"
  | "1 month"
  | "2 months"
  | "3 months"
  | "6 months"
  | "1 year"
  | "Custom Dates"

export interface MarketingScheduleItem {
  sl: number
  date: string
  done: boolean
  remarks: string
  type?: "poster" | "video"
}

export interface MarketingPerformanceReport {
  startDate?: string
  endDate?: string
  postsDelivered?: string // e.g. "12 poster"
  videosDelivered?: string // e.g. "2 AI Reels"
  leadsGenerated?: number | string // e.g. 16
  reach?: number | string // e.g. 7409
  followersGained?: number | string // e.g. 5
}

export interface DigitalMarketingPackage {
  enabled: boolean
  formNumber?: string // e.g. "FORM NO - 9"
  planName: string // e.g. "Grow - 1", "Grow - 2", "Pro Brand", "Custom Retainer"
  packageDuration: MarketingPlanDuration | string // e.g. "1 month", "Weekly", "Yearly"
  startDate: string // e.g. "2026-09-25" or "25/Sep/2026"
  expireDate: string // e.g. "2026-10-24" or "24/Oct/2026"
  category?: string // e.g. "Solar", "Printing", "Retail", "Jewellery", "Healthcare"
  specialNote?: string

  // Deliverable Quantities / Quotas
  postersCount?: number // e.g. 12
  bannersCount?: number // e.g. 4
  leafletsCount?: number // e.g. 1
  videosCount?: number // e.g. 2
  hasRealModelShoot?: boolean
  modelShootDate?: string // e.g. "23/10/2026"
  modelShootNotes?: string // e.g. "Real Model Shoot extra"
  hasTotoAds?: boolean
  totoAdsNotes?: string // e.g. "Debra & Balichak Route Toto Ads"
  targetLocations?: string // e.g. "Amlagora 721121, Balichak 721124, Chandrakona 721402, Debra 721126"

  // Social Platforms Targeted
  platforms?: string[] // ["Facebook", "Instagram", "Google Ads", "YouTube", "WhatsApp", "Local Toto"]

  // Deliverable Schedules (Matching Form No - 9)
  posterSchedule?: MarketingScheduleItem[]
  videoSchedule?: MarketingScheduleItem[]

  // Actual Delivered Performance Metrics
  performance?: MarketingPerformanceReport

  // Financials if packaged separately
  packagePrice?: number
  adSpendBudget?: number // Client ad budget (paid to Meta/Google)
  agencyFee?: number // Agency management fee
}

export const PRESET_MARKETING_PLANS: Array<{
  name: string
  duration: string
  postersCount: number
  videosCount: number
  description: string
  modelShootIncluded: boolean
  price: number
}> = [
  {
    name: "Grow - 1",
    duration: "1 month",
    postersCount: 8,
    videosCount: 1,
    description: "8 Promotional Posters + 1 Video Reel, Meta Ads Targeting & Local Audience",
    modelShootIncluded: false,
    price: 6500,
  },
  {
    name: "Grow - 2",
    duration: "1 month",
    postersCount: 12,
    videosCount: 2,
    description: "12 Posters/Banners/Leaflets + 2 AI Video Reels, Full Pin Code Targeting, Weekly Reports",
    modelShootIncluded: true,
    price: 12000,
  },
  {
    name: "Grow - 3 (Pro)",
    duration: "1 month",
    postersCount: 20,
    videosCount: 4,
    description: "20 Edited Creatives, 4 High-Converting Video Reels, Model Shoot, Lead Gen Funnel",
    modelShootIncluded: true,
    price: 22000,
  },
  {
    name: "Weekly Campaign Boost",
    duration: "Weekly",
    postersCount: 4,
    videosCount: 1,
    description: "7-Day High Impact Festive/Offer Campaign (4 Creatives + 1 Video Reel)",
    modelShootIncluded: false,
    price: 3500,
  },
  {
    name: "Yearly Brand Domination",
    duration: "1 year",
    postersCount: 150,
    videosCount: 24,
    description: "Annual 365-Day Retainer, Monthly Shoots, Continuous Meta/Google Ads & Toto Ads",
    modelShootIncluded: true,
    price: 120000,
  },
]

export function createDefaultMarketingPackage(planName = "Grow - 2"): DigitalMarketingPackage {
  const today = new Date()
  const exp = new Date(today.getTime() + 30 * 86400000)

  const fmt = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0")
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${day}/${months[d.getMonth()]}/${d.getFullYear()}`
  }

  const defaultPosters: MarketingScheduleItem[] = Array.from({ length: 12 }).map((_, i) => ({
    sl: i + 1,
    date: fmt(new Date(today.getTime() + i * 2.5 * 86400000)),
    done: false,
    remarks: i === 2 ? "Poster Banner" : i === 3 ? "Banner" : i === 4 ? "Leaflet" : "Poster",
    type: "poster",
  }))

  const defaultVideos: MarketingScheduleItem[] = [
    { sl: 1, date: fmt(new Date(today.getTime() + 5 * 86400000)), done: false, remarks: "Ads - Video Reels", type: "video" },
    { sl: 2, date: fmt(new Date(today.getTime() + 20 * 86400000)), done: false, remarks: "AI Reel Video", type: "video" },
  ]

  return {
    enabled: true,
    formNumber: "FORM NO - 9",
    planName,
    packageDuration: "1 month",
    startDate: fmt(today),
    expireDate: fmt(exp),
    category: "General",
    specialNote: "",
    postersCount: 12,
    bannersCount: 2,
    leafletsCount: 1,
    videosCount: 2,
    hasRealModelShoot: true,
    modelShootDate: fmt(new Date(today.getTime() + 15 * 86400000)),
    modelShootNotes: "Real Model Shoot extra",
    hasTotoAds: false,
    totoAdsNotes: "",
    targetLocations: "Balichak 721124, Debra 721126, Ghatal 721146, Kharagpur 721123",
    platforms: ["Facebook", "Instagram", "Meta Ads", "WhatsApp"],
    posterSchedule: defaultPosters,
    videoSchedule: defaultVideos,
    performance: {
      startDate: fmt(today),
      endDate: fmt(exp),
      postsDelivered: "12 poster",
      videosDelivered: "2 AI Reels",
      leadsGenerated: 0,
      reach: 0,
      followersGained: 0,
    },
    packagePrice: 12000,
  }
}

