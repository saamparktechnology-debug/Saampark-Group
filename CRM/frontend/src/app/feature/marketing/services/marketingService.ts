import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems } from "@/lib/storageSync"
import { MarketingCampaign, MarketingPost } from "../types"

const SEED_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: "mkt_clt_1001",
    clientId: "CLT-1001",
    clientName: "Mahaprabhu Enterprise",
    clientEmail: "contact@mahaprabhu.com",
    clientAvatar: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=150&auto=format&fit=crop&q=80",
    companyId: "consultancy",
    branchName: "Kolkata HQ",
    packageName: "Premium Digital Package",
    packageDurationMonths: 3,
    startDate: "2026-10-01",
    endDate: "2027-01-31",
    status: "Active",
    totalCommitment: 68,
    totalPosted: 52,
    totalLeads: 450,
    services: {
      poster: {
        serviceKey: "poster",
        serviceName: "Poster",
        commitment: 20,
        posted: 18,
        views: 78500,
        reach: 62100,
        leads: 420,
        thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80"
      },
      video: {
        serviceKey: "video",
        serviceName: "Video",
        commitment: 15,
        posted: 12,
        views: 56800,
        reach: 44700,
        leads: 310,
        thumbnailUrl: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=300&auto=format&fit=crop&q=80"
      },
      real_model: {
        serviceKey: "real_model",
        serviceName: "Real Model Video",
        commitment: 10,
        posted: 8,
        views: 42300,
        reach: 35600,
        leads: 220,
        thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
      },
      custom: {
        serviceKey: "custom",
        serviceName: "Tutor Service",
        commitment: 15,
        posted: 13,
        views: 35200,
        reach: 29800,
        leads: 180,
        thumbnailUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&auto=format&fit=crop&q=80"
      }
    }
  }
]

const SEED_POSTS: MarketingPost[] = [
  {
    id: "post_1",
    campaignId: "mkt_clt_1001",
    clientId: "CLT-1001",
    clientName: "Mahaprabhu Enterprise",
    service: "Poster",
    title: "Diwali Festival Grand Mega Offer",
    contentPreview: "https://images.unsplash.com/photo-1576764402988-7143f9cca90a?w=150&auto=format&fit=crop&q=80",
    publishedAt: "31 Oct 2026, 05:30 PM",
    status: "Posted",
    views: 8500,
    reach: 6100,
    leads: 120,
    notes: "High engagement festival creative on Instagram & Facebook"
  },
  {
    id: "post_2",
    campaignId: "mkt_clt_1001",
    clientId: "CLT-1001",
    clientName: "Mahaprabhu Enterprise",
    service: "Video",
    title: "Product Launch Reel Teaser",
    contentPreview: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=150&auto=format&fit=crop&q=80",
    publishedAt: "30 Oct 2026, 06:15 PM",
    status: "Posted",
    views: 7200,
    reach: 5300,
    leads: 95,
    notes: "Meta Ads Boosted with ₹500 daily budget"
  },
  {
    id: "post_3",
    campaignId: "mkt_clt_1001",
    clientId: "CLT-1001",
    clientName: "Mahaprabhu Enterprise",
    service: "Real Model Video",
    title: "Model Brand Walkthrough & Testimonial",
    contentPreview: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    publishedAt: "29 Oct 2026, 07:20 PM",
    status: "Posted",
    views: 9100,
    reach: 6800,
    leads: 140,
    notes: "Shot with studio real model; top lead generator"
  },
  {
    id: "post_4",
    campaignId: "mkt_clt_1001",
    clientId: "CLT-1001",
    clientName: "Mahaprabhu Enterprise",
    service: "Tutor Service",
    title: "Skill Learning Special Course Ad",
    contentPreview: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=150&auto=format&fit=crop&q=80",
    publishedAt: "28 Oct 2026, 08:10 PM",
    status: "Posted",
    views: 7700,
    reach: 5500,
    leads: 110,
    notes: "Educational carousel ad published on LinkedIn & Meta"
  },
  {
    id: "post_5",
    campaignId: "mkt_clt_1001",
    clientId: "CLT-1001",
    clientName: "Mahaprabhu Enterprise",
    service: "Video",
    title: "Customer Review Compilation Reel",
    contentPreview: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=150&auto=format&fit=crop&q=80",
    publishedAt: "27 Oct 2026, 07:45 PM",
    status: "Posted",
    views: 6900,
    reach: 4900,
    leads: 100,
    notes: "Organic viral reach on Instagram Reels"
  }
]

export const MarketingService = {
  // Get all campaigns
  async getCampaigns(companyId?: string): Promise<MarketingCampaign[]> {
    try {
      const stored = await fetchModuleDataFromDB<MarketingCampaign[]>("marketing_campaigns", [], "all").catch(() => [])
      let campaigns = filterGlobalDeletedItems(stored || [])
      if (!campaigns || campaigns.length === 0) {
        campaigns = [...SEED_CAMPAIGNS]
        await saveModuleDataToDB("marketing_campaigns", campaigns, "all").catch(() => {})
      }
      return campaigns
    } catch {
      return SEED_CAMPAIGNS
    }
  },

  // Get all posts for a campaign
  async getPosts(campaignId?: string): Promise<MarketingPost[]> {
    try {
      const stored = await fetchModuleDataFromDB<MarketingPost[]>("marketing_posts", [], "all").catch(() => [])
      let posts = filterGlobalDeletedItems(stored || [])
      if (!posts || posts.length === 0) {
        posts = [...SEED_POSTS]
        await saveModuleDataToDB("marketing_posts", posts, "all").catch(() => {})
      }
      if (campaignId) {
        return posts.filter(p => p.campaignId === campaignId)
      }
      return posts
    } catch {
      return SEED_POSTS
    }
  },

  // Record a new post deliverable
  async addPost(post: Omit<MarketingPost, "id">): Promise<MarketingPost> {
    const newPost: MarketingPost = {
      ...post,
      id: `post_${Date.now()}`
    }
    const currentPosts = await this.getPosts()
    const updatedPosts = [newPost, ...currentPosts]
    await saveModuleDataToDB("marketing_posts", updatedPosts, "all")

    // Update campaign deliverable counters
    const campaigns = await this.getCampaigns()
    const targetCampaign = campaigns.find(c => c.id === post.campaignId || c.clientId === post.clientId)
    if (targetCampaign) {
      const serviceKey = Object.keys(targetCampaign.services).find(
        key => targetCampaign.services[key].serviceName.toLowerCase() === post.service.toLowerCase()
      )
      if (serviceKey && targetCampaign.services[serviceKey]) {
        const quota = targetCampaign.services[serviceKey]
        quota.posted += 1
        quota.views += post.views || 0
        quota.reach += post.reach || 0
        quota.leads += post.leads || 0
      }
      targetCampaign.totalPosted += 1
      targetCampaign.totalLeads += post.leads || 0
      await saveModuleDataToDB("marketing_campaigns", campaigns, "all")
    }

    return newPost
  },

  // Save / Update campaign
  async saveCampaign(campaign: MarketingCampaign): Promise<MarketingCampaign> {
    const campaigns = await this.getCampaigns()
    const idx = campaigns.findIndex(c => c.id === campaign.id)
    let updated: MarketingCampaign[]
    if (idx >= 0) {
      updated = [...campaigns]
      updated[idx] = campaign
    } else {
      updated = [campaign, ...campaigns]
    }
    await saveModuleDataToDB("marketing_campaigns", updated, "all")
    return campaign
  },

  // Auto provision campaign from quotation or invoice
  async autoProvisionFromQuotation(client: any, packageName: string, commitments: any, companyId: string) {
    const campaigns = await this.getCampaigns()
    const now = new Date()
    const end = new Date()
    end.setMonth(now.getMonth() + 3)

    const newCampaign: MarketingCampaign = {
      id: `mkt_${Date.now()}`,
      clientId: client.id || `CLT-${Date.now().toString().slice(-4)}`,
      clientName: client.name || client.customer || "Marketing Client",
      clientEmail: client.email || client.customerEmail || "",
      companyId: companyId || "consultancy",
      branchName: client.branchName || "Main HQ",
      packageName: packageName || "Custom Digital Marketing Package",
      packageDurationMonths: 3,
      startDate: now.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      status: "Active",
      totalCommitment: (commitments?.poster || 20) + (commitments?.video || 15) + (commitments?.real_model || 10) + (commitments?.custom || 15),
      totalPosted: 0,
      totalLeads: 0,
      services: {
        poster: {
          serviceKey: "poster",
          serviceName: "Poster",
          commitment: commitments?.poster || 20,
          posted: 0,
          views: 0,
          reach: 0,
          leads: 0,
          thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80"
        },
        video: {
          serviceKey: "video",
          serviceName: "Video",
          commitment: commitments?.video || 15,
          posted: 0,
          views: 0,
          reach: 0,
          leads: 0,
          thumbnailUrl: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=300&auto=format&fit=crop&q=80"
        },
        real_model: {
          serviceKey: "real_model",
          serviceName: "Real Model Video",
          commitment: commitments?.real_model || 10,
          posted: 0,
          views: 0,
          reach: 0,
          leads: 0,
          thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
        },
        custom: {
          serviceKey: "custom",
          serviceName: commitments?.customName || "Tutor Service",
          commitment: commitments?.custom || 15,
          posted: 0,
          views: 0,
          reach: 0,
          leads: 0,
          thumbnailUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&auto=format&fit=crop&q=80"
        }
      }
    }

    const updated = [newCampaign, ...campaigns]
    await saveModuleDataToDB("marketing_campaigns", updated, "all")
    return newCampaign
  }
}
