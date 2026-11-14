import { fetchModuleDataFromDB, saveModuleDataToDB, filterGlobalDeletedItems, markGlobalItemDeleted } from "@/lib/storageSync"
import { MarketingCampaign, MarketingPost, MarketingLead } from "../types"
import { sendMarketingFirstPostEmailNotification, sendMarketingCompletedEmailNotification } from "@/services/emailNotificationService"

export const MarketingService = {
  // Get all campaigns
  async getCampaigns(companyId?: string): Promise<MarketingCampaign[]> {
    try {
      const [allStored, compStored] = await Promise.all([
        fetchModuleDataFromDB<MarketingCampaign[]>("marketing_campaigns", [], "all").catch(() => []),
        companyId && companyId !== "all" 
          ? fetchModuleDataFromDB<MarketingCampaign[]>("marketing_campaigns", [], companyId).catch(() => []) 
          : Promise.resolve([])
      ])

      const map = new Map<string, MarketingCampaign>()
      for (const item of [...(Array.isArray(allStored) ? allStored : []), ...(Array.isArray(compStored) ? compStored : [])]) {
        if (item && item.id && item.id !== "mkt_clt_1001" && item.clientName !== "Mahaprabhu Enterprise") {
          // Normalize stage
          if (!item.stage) {
            item.stage = item.totalPosted >= item.totalCommitment ? "Completed" : (item.totalPosted > 0 ? "Action" : "Pending")
          }
          map.set(item.id, item)
        }
      }

      let clean = filterGlobalDeletedItems(Array.from(map.values()))
      if (companyId && companyId !== "all") {
        clean = clean.filter(c => !c.companyId || c.companyId === companyId || c.companyId === "all")
      }
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

    // Update campaign deliverable counters & 3-stage lifecycle
    const campaigns = await this.getCampaigns()
    const targetCampaign = campaigns.find(c => c.id === post.campaignId || c.clientId === post.clientId)
    if (targetCampaign) {
      const wasFirstPost = targetCampaign.totalPosted === 0 || targetCampaign.stage === "Pending"

      const serviceKey = Object.keys(targetCampaign.services || {}).find(
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

      // Stage Transitions:
      // Stage 1: "Pending" -> Stage 2: "Action" (upon 1st post)
      // Stage 2: "Action"  -> Stage 3: "Completed" (when all deliverables finish)
      if (targetCampaign.totalPosted >= targetCampaign.totalCommitment) {
        targetCampaign.stage = "Completed"
        targetCampaign.status = "Completed"

        // Automated Email to client: Deliverables 100% Completed
        if (targetCampaign.clientEmail) {
          sendMarketingCompletedEmailNotification({
            clientName: targetCampaign.clientName,
            clientEmail: targetCampaign.clientEmail,
            campaignName: targetCampaign.packageName || "Digital Marketing Retainer",
            totalPosted: targetCampaign.totalPosted,
            totalCommitment: targetCampaign.totalCommitment,
            totalViews: Object.values(targetCampaign.services || {}).reduce((s, q) => s + (q.views || 0), 0),
            totalReach: Object.values(targetCampaign.services || {}).reduce((s, q) => s + (q.reach || 0), 0),
            totalLeads: targetCampaign.totalLeads,
            companyId: targetCampaign.companyId,
          }).catch(err => console.warn("Marketing completion email error:", err))
        }
      } else if (wasFirstPost) {
        targetCampaign.stage = "Action"
        targetCampaign.status = "Active"

        // Automated Email to client: 1st Post Published!
        if (targetCampaign.clientEmail) {
          sendMarketingFirstPostEmailNotification({
            clientName: targetCampaign.clientName,
            clientEmail: targetCampaign.clientEmail,
            campaignName: targetCampaign.packageName || "Digital Marketing Retainer",
            postTitle: post.title,
            service: post.service,
            platform: post.platform || "Meta",
            postUrl: post.postUrl,
            contentPreview: post.contentPreview,
            companyId: targetCampaign.companyId,
          }).catch(err => console.warn("Marketing 1st post email error:", err))
        }
      }

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

  // Delete campaign
  async deleteCampaign(id: string): Promise<boolean> {
    await markGlobalItemDeleted(id, "marketing_campaigns")
    const campaigns = await this.getCampaigns()
    const updated = campaigns.filter(c => c.id !== id)
    await saveModuleDataToDB("marketing_campaigns", updated, "all")
    return true
  },

  // Delete post
  async deletePost(id: string): Promise<boolean> {
    await markGlobalItemDeleted(id, "marketing_posts")
    const posts = await this.getPosts()
    const updated = posts.filter(p => p.id !== id)
    await saveModuleDataToDB("marketing_posts", updated, "all")
    return true
  },

  // Get marketing leads
  async getMarketingLeads(campaignId?: string): Promise<MarketingLead[]> {
    try {
      const stored = await fetchModuleDataFromDB<MarketingLead[]>("marketing_leads", [], "all").catch(() => [])
      const clean = filterGlobalDeletedItems(stored || [])
      if (campaignId) {
        return clean.filter(l => l.campaignId === campaignId)
      }
      return clean
    } catch {
      return []
    }
  },

  // Add marketing lead
  async addMarketingLead(lead: Omit<MarketingLead, "id">): Promise<MarketingLead> {
    const newLead: MarketingLead = {
      ...lead,
      id: `mkt_lead_${Date.now()}`
    }
    const current = await this.getMarketingLeads()
    const updated = [newLead, ...current]
    await saveModuleDataToDB("marketing_leads", updated, "all")

    // Update campaign totalLeads counter
    if (lead.campaignId) {
      const campaigns = await this.getCampaigns()
      const camp = campaigns.find(c => c.id === lead.campaignId)
      if (camp) {
        camp.totalLeads = (camp.totalLeads || 0) + 1
        await saveModuleDataToDB("marketing_campaigns", campaigns, "all")
      }
    }

    return newLead
  },

  // Update marketing lead status
  async updateMarketingLeadStatus(id: string, status: "New" | "Contacted" | "Converted"): Promise<void> {
    const leads = await this.getMarketingLeads()
    const target = leads.find(l => l.id === id)
    if (target) {
      target.status = status
      await saveModuleDataToDB("marketing_leads", leads, "all")
    }
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
      branchId: client.branchId || undefined,
      subBranchId: client.subBranchId || undefined,
      invoiceId: client.invoiceId || undefined,
      packageName: packageName || "Custom Digital Marketing Package",
      packageDurationMonths: 3,
      startDate: now.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      stage: "Pending",
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
