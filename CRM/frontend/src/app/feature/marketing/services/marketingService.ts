import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems } from "@/lib/storageSync"
import { MarketingCampaign, MarketingPost } from "../types"

export const MarketingService = {
  // Get all campaigns
  async getCampaigns(companyId?: string): Promise<MarketingCampaign[]> {
    try {
      const stored = await fetchModuleDataFromDB<MarketingCampaign[]>("marketing_campaigns", [], "all").catch(() => [])
      // Strictly filter out any previous mock demo campaigns
      const clean = filterGlobalDeletedItems(stored || []).filter(c => 
        c && c.id !== "mkt_clt_1001" && c.clientName !== "Mahaprabhu Enterprise"
      )
      return clean
    } catch {
      return []
    }
  },

  // Get all posts for a campaign
  async getPosts(campaignId?: string): Promise<MarketingPost[]> {
    try {
      const stored = await fetchModuleDataFromDB<MarketingPost[]>("marketing_posts", [], "all").catch(() => [])
      // Strictly filter out any previous mock demo posts
      const clean = filterGlobalDeletedItems(stored || []).filter(p => 
        p && p.campaignId !== "mkt_clt_1001" && p.clientName !== "Mahaprabhu Enterprise"
      )
      if (campaignId) {
        return clean.filter(p => p.campaignId === campaignId)
      }
      return clean
    } catch {
      return []
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

