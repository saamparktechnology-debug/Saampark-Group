"use client"

export type MarketingPlanDuration =
  | "1 month"
  | "3 months"
  | "6 months"
  | "1 year"
  | "Weekly"
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
  postsDelivered?: string
  videosDelivered?: string
  leadsGenerated?: number | string
  reach?: number | string
  followersGained?: number | string
}

export interface DigitalMarketingPackage {
  enabled: boolean
  formNumber?: string
  planName: string
  packageDuration: MarketingPlanDuration | string
  startDate: string
  expireDate: string
  category?: string
  specialNote?: string

  // Deliverables
  postersCount: number
  bannersCount?: number
  leafletsCount?: number
  videosCount: number
  storyCount?: number
  hasRealModelShoot?: boolean
  modelShootDate?: string
  modelShootNotes?: string
  hasTotoAds?: boolean
  totoAdsNotes?: string
  targetLocations?: string

  // Offer & Multi-month Pricing
  durationMonths?: number
  baseMonthlyPrice?: number
  discountPercent?: number
  freeOfferText?: string

  // Display badges
  expectedViews?: string
  expectedLeads?: string
  bestFor?: string
  features?: string[]

  // Platforms
  platforms?: string[]

  // Schedules
  posterSchedule?: MarketingScheduleItem[]
  videoSchedule?: MarketingScheduleItem[]

  // Performance
  performance?: MarketingPerformanceReport

  // Financials
  packagePrice: number
  adSpendBudget?: number
  agencyFee?: number
}

// 9 Packages from Saampark Consultancy Service Flyer
export const SAAMPARK_9_PACKAGES = [
  {
    id: "pkg-01",
    name: "Package 01 - Start",
    price: 1999,
    postersCount: 8,
    videosCount: 1, // 1 AI Reel
    storyCount: 8,
    hasRealModelShoot: false,
    expectedViews: "10K Views/Month (Estimate)",
    expectedLeads: "Startup Traction",
    bestFor: "Startups & Small Businesses",
    description: "8 Premium Posts, 1 AI Reel, 8 Story Designs, Festive Post, Page Setup",
    features: [
      "8 Premium Social Media Posts",
      "1 AI Reel",
      "8 Story Designs",
      "Festive Post",
      "Page Setup",
      "10K Views/Month (Estimate)"
    ]
  },
  {
    id: "pkg-02",
    name: "Package 02 - Grow",
    price: 4999,
    postersCount: 12,
    videosCount: 2, // 2 AI Reels
    storyCount: 12,
    hasRealModelShoot: false,
    expectedViews: "20K - 30K Views/Month (Estimate)",
    expectedLeads: "8 - 10 Leads/Month (Expected)",
    bestFor: "Growing Businesses",
    description: "12 Premium Posts, 2 AI Reels, 12 Stories, Festive Post, Page Setup, Facebook & Instagram Management, Content Writing",
    features: [
      "12 Premium Social Media Posts",
      "2 AI Reels",
      "12 Story Designs",
      "Festive Post",
      "Page Setup",
      "Facebook & Instagram Management",
      "Content Writing",
      "20K - 30K Views/Month",
      "8 - 10 Leads/Month"
    ]
  },
  {
    id: "pkg-03",
    name: "Package 03 - Boost",
    price: 7999,
    postersCount: 16,
    videosCount: 5, // 4 AI Reels + 1 Promo Video (1 min)
    storyCount: 16,
    hasRealModelShoot: false,
    expectedViews: "60K - 80K Views/Month (Estimate)",
    expectedLeads: "15 - 18 Leads/Month (Expected)",
    bestFor: "Established Businesses",
    description: "16 Premium Posts, 4 AI Reels, 1 Promo Video (1 min), 16 Stories, Facebook Cover Page, Page Setup, Content Writing, Hashtag Research",
    features: [
      "16 Premium Social Media Posts",
      "4 AI Reels",
      "1 AI / Normal Promotional Video (1 min)",
      "16 Story Designs",
      "Facebook Cover Page",
      "Page Setup",
      "Content Writing",
      "Hashtag Research",
      "60K - 80K Views/Month",
      "15 - 18 Leads/Month"
    ]
  },
  {
    id: "pkg-04",
    name: "Package 04 - Business Pro",
    price: 9999,
    postersCount: 20,
    videosCount: 8, // 6 AI Reels + 2 Promo Videos
    storyCount: 20,
    hasRealModelShoot: false,
    expectedViews: "110K - 120K Views/Month (Estimate)",
    expectedLeads: "30 - 35 Leads/Month (Expected)",
    bestFor: "Small & Growing Businesses",
    description: "20 Premium Posts, 6 AI Reels, 2 Promo Videos, 20 Story Updates, Festive Posts, Page Setup, Facebook Cover Page, Content Writing",
    features: [
      "20 Premium Social Media Posts",
      "6 AI Reels",
      "2 AI / Normal Promotional Videos",
      "20 Story Updates",
      "Festive Posts",
      "Page Setup",
      "Facebook Cover Page",
      "Content Writing",
      "110K - 120K Views/Month",
      "30 - 35 Leads/Month"
    ]
  },
  {
    id: "pkg-05",
    name: "Package 05 - Business Plus",
    price: 11999,
    postersCount: 24,
    videosCount: 9, // 6 AI Reels + 3 Promo Videos
    storyCount: 90, // 3 Daily Stories
    hasRealModelShoot: false,
    expectedViews: "120K - 150K Views/Month (Estimate)",
    expectedLeads: "35 - 40 Leads/Month (Expected)",
    bestFor: "Growing Businesses",
    description: "24 Premium Posts, 6 AI Reels, 3 Daily Stories, 3 Promo Videos, Festive Posts, Page Setup, Facebook Cover Page, Content Writing, Hashtag Research",
    features: [
      "24 Premium Social Media Posts",
      "6 AI Reels",
      "3 Daily Story Updates",
      "3 AI / Normal Promotional Videos",
      "Festive Posts",
      "Page Setup",
      "Facebook Cover Page",
      "Content Writing",
      "Hashtag Research",
      "120K - 150K Views/Month",
      "35 - 40 Leads/Month"
    ]
  },
  {
    id: "pkg-06",
    name: "Package 06 - Business Elite",
    price: 14999,
    postersCount: 30,
    videosCount: 11, // 8 AI Reels + 3 Promo Videos
    storyCount: 90, // 3 Daily Stories
    hasRealModelShoot: false,
    expectedViews: "140K - 160K Views/Month (Estimate)",
    expectedLeads: "45 - 55 Leads/Month (Expected)",
    bestFor: "Established Businesses",
    description: "30 Premium Posts, 8 AI Reels, 3 Daily Stories, 3 Promo Videos, Festive Posts, Page Setup, Facebook Cover Page, Content Writing, Hashtag Research",
    features: [
      "30 Premium Social Media Posts",
      "8 AI Reels",
      "3 Daily Story Updates",
      "3 AI / Normal Promotional Videos",
      "Festive Posts",
      "Page Setup",
      "Facebook Cover Page",
      "Content Writing",
      "Hashtag Research",
      "140K - 160K Views/Month",
      "45 - 55 Leads/Month"
    ]
  },
  {
    id: "pkg-07",
    name: "Package 07 - Enterprise",
    price: 19999,
    postersCount: 30,
    videosCount: 14, // 10 AI Reels + 4 Promo Videos
    storyCount: 30, // Daily Stories
    hasRealModelShoot: true,
    expectedViews: "200K - 230K Views/Month (Estimate)",
    expectedLeads: "60 - 70 Leads/Month (Expected)",
    bestFor: "Large Businesses",
    description: "30 Premium Posts, 10 AI Reels, Daily Stories, 4 Promo Videos, Festive Posts, Page Setup, Facebook Cover Page, Content Writing, Hashtag Research",
    features: [
      "30 Premium Social Media Posts",
      "10 AI Reels",
      "Daily Story Updates",
      "4 AI / Normal Promotional Videos",
      "Festive Posts",
      "Page Setup",
      "Facebook Cover Page",
      "Content Writing",
      "Hashtag Research",
      "200K - 230K Views/Month",
      "60 - 70 Leads/Month"
    ]
  },
  {
    id: "pkg-08",
    name: "Package 08 - Enterprise Plus",
    price: 25999,
    postersCount: 35,
    videosCount: 16, // 12 AI Reels + 4 Promo Videos
    storyCount: 30, // Daily Stories
    hasRealModelShoot: true,
    expectedViews: "230K - 250K Views/Month (Estimate)",
    expectedLeads: "120 - 150 Leads/Month (Expected)",
    bestFor: "Multi-Brand Businesses",
    description: "35 Premium Posts, 12 AI Reels, Daily Stories, 4 Promo Videos, Festive Posts, Page Setup, Facebook Cover Page, Content Writing, Hashtag Research",
    features: [
      "35 Premium Social Media Posts",
      "12 AI Reels",
      "Daily Story Updates",
      "4 AI / Normal Promotional Videos",
      "Festive Posts",
      "Page Setup",
      "Facebook Cover Page",
      "Content Writing",
      "Hashtag Research",
      "230K - 250K Views/Month",
      "120 - 150 Leads/Month"
    ]
  },
  {
    id: "pkg-09",
    name: "Package 09 - Ultimate Growth",
    price: 29999,
    postersCount: 40,
    videosCount: 16, // 12 AI Reels + 4 Promo Videos
    storyCount: 30, // Daily Stories
    hasRealModelShoot: true,
    expectedViews: "300K+ Views/Month (Estimate)",
    expectedLeads: "120 - 300 Leads/Month (Expected)",
    bestFor: "Maximum Business Growth",
    description: "40 Premium Posts, 12 AI Reels, Daily Stories, 4 Promo Videos, Festive Posts, Page Setup, Facebook Cover Page, Content Writing, Hashtag Research, Priority Support",
    features: [
      "40 Premium Social Media Posts",
      "12 AI Reels",
      "Daily Story Updates",
      "4 AI / Normal Promotional Videos",
      "Festive Posts",
      "Page Setup",
      "Facebook Cover Page",
      "Content Writing",
      "Hashtag Research",
      "Priority Support",
      "300K+ Views/Month",
      "120 - 300 Leads/Month"
    ]
  }
]

export const PRESET_MARKETING_PLANS = SAAMPARK_9_PACKAGES

export const DURATION_OFFERS = [
  { label: "1 Month (Standard Plan)", value: "1 month", months: 1, discountPct: 0, offer: "" },
  { label: "3 Months Plan (5% OFF)", value: "3 months", months: 3, discountPct: 5, offer: "5% OFF" },
  { label: "6 Months Plan (10% OFF)", value: "6 months", months: 6, discountPct: 10, offer: "10% OFF" },
  { label: "12 Months / 1 Year Plan (20% OFF + TOTO or Model FREE)", value: "1 year", months: 12, discountPct: 20, offer: "20% OFF + TOTO or Model FREE" },
]

export function calculatePackageTotal(baseMonthlyPrice: number, duration: string) {
  const opt = DURATION_OFFERS.find(d => d.value === duration) || DURATION_OFFERS[0]
  const gross = baseMonthlyPrice * opt.months
  const discountAmount = Math.round(gross * (opt.discountPct / 100))
  const net = gross - discountAmount
  return {
    months: opt.months,
    discountPct: opt.discountPct,
    discountAmount,
    netPrice: net,
    offer: opt.offer
  }
}

export function createDefaultMarketingPackage(planName = "Package 02 - Grow"): DigitalMarketingPackage {
  const today = new Date()
  const exp = new Date(today.getTime() + 30 * 86400000)

  const fmt = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0")
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${day}/${months[d.getMonth()]}/${d.getFullYear()}`
  }

  const selectedPkg = SAAMPARK_9_PACKAGES.find(p => p.name.includes(planName)) || SAAMPARK_9_PACKAGES[1]

  return {
    enabled: true,
    formNumber: "FORM NO - 9",
    planName: selectedPkg.name,
    packageDuration: "1 month",
    startDate: fmt(today),
    expireDate: fmt(exp),
    category: "Digital Marketing",
    specialNote: selectedPkg.description,
    postersCount: selectedPkg.postersCount,
    videosCount: selectedPkg.videosCount,
    storyCount: selectedPkg.storyCount,
    hasRealModelShoot: selectedPkg.hasRealModelShoot,
    hasTotoAds: false,
    platforms: ["Facebook", "Instagram", "Meta Ads", "WhatsApp"],
    packagePrice: selectedPkg.price,
    baseMonthlyPrice: selectedPkg.price,
    durationMonths: 1,
    discountPercent: 0,
    expectedViews: selectedPkg.expectedViews,
    expectedLeads: selectedPkg.expectedLeads,
    bestFor: selectedPkg.bestFor,
    features: selectedPkg.features,
  }
}
