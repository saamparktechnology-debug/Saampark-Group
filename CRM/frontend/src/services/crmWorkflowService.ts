import { Lead } from "@/app/feature/leads/types"
import { getClients, saveStoredClient } from "@/app/feature/clients/services/clientService"
import { addProject, getProjects } from "@/app/feature/projects/services/projectService"
import { addInvoice, InvoiceItem } from "@/app/feature/sales/invoices/services/invoiceService"
import { recordUserAccount } from "@/app/feature/users/services/userService"
import { executeWithFeedback } from "@/store/useActionFeedbackStore"

export interface ProposalWorkflowData {
  id: string
  title: string
  clientName: string
  clientEmail?: string
  totalAmount: number | string
  items?: Array<{ name: string; amount: number }>
  companyId?: string
  branchId?: string
  branchName?: string
}

export const crmWorkflowService = {
  /**
   * Automatically executes the complete Won-Lead workflow:
   * 1. Creates/verifies Client profile
   * 2. Auto-creates active Project
   * 3. Auto-drafts Initial Tax Invoice
   */
  async convertLeadToWon(lead: Lead, companyId?: string): Promise<{ clientId: string; projectId: string; invoiceId: string }> {
    const effComp = lead.companyId || companyId || "tech"
    const clientName = lead.name || "Won Client"
    const rawEmail = (lead.email || "").trim()
    const internalEmail = rawEmail || `lead_${lead.id}@saampark.in`

    // 1. Client Creation / Lookup
    const storedClients = await getClients(effComp)
    let client = storedClients.find(
      (c) => c.name.toLowerCase().trim() === clientName.toLowerCase().trim() || 
             (rawEmail && c.email?.toLowerCase().trim() === rawEmail.toLowerCase().trim())
    )

    const clientId = client?.id || `cli_${lead.id}`
    if (!client) {
      const newClient = {
        id: clientId,
        name: clientName,
        primaryContact: lead.primaryContact || lead.name,
        email: rawEmail,
        phone: lead.phone || "N/A",
        group: "VIP Client",
        label: lead.service || "Converted Lead",
        labelColor: "#3b82f6",
        projectsCount: 1,
        totalInvoiced: lead.value || "₹25,000",
        paymentReceived: "₹0",
        due: lead.value || "₹25,000",
        address: `${lead.city || ""}, ${lead.state || ""}, ${lead.country || ""}`.trim(),
        branchId: lead.branchId,
        branchName: lead.branchName,
        companyId: effComp,
      }
      await saveStoredClient(newClient as any, effComp)

      // Register portal login for client
      recordUserAccount({
        id: `usr_cli_${lead.id}`,
        name: lead.primaryContact || lead.name,
        email: internalEmail,
        role: "Clients",
        companyId: effComp,
        companyIds: [effComp],
        branchId: lead.branchId,
        branchName: lead.branchName,
        phone: lead.phone,
        password: "Password123",
        status: "Active",
      }, true)
    }

    // 2. Project Auto-Creation
    const existingProjects = await getProjects(effComp)
    const existingProject = existingProjects.find(p => p.client === clientName || p.title.includes(clientName))
    
    let projectId = existingProject?.id || ""
    if (!existingProject) {
      const todayStr = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })
      const dueStr = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })
      
      const createdProject = await addProject({
        title: `${clientName} - ${lead.service || "Implementation & Delivery"}`,
        client: clientName,
        clientAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clientName)}`,
        price: lead.value || "₹25,000",
        startDate: todayStr,
        deadline: dueStr,
        progress: 10,
        status: "In progress",
        priority: "High",
        tags: ["Lead Conversion", "Kickoff", lead.service || "Services"],
        description: `Automatically created on Lead Won conversion. Phone: ${lead.phone || 'N/A'}. Source: ${lead.source || 'Direct'}. Lead Owner: ${lead.caller || lead.owner || 'Team'}.`,
        companyId: effComp,
        branchId: lead.branchId,
        branchName: lead.branchName,
      } as any, effComp)
      projectId = createdProject.id
    }

    // 3. Draft Kickoff Invoice Auto-Creation
    const cleanNumeric = parseFloat(String(lead.value || "25000").replace(/[^0-9.]/g, "")) || 25000
    const invoiceId = `INV-WON-${Date.now().toString().slice(-5)}`
    const todayISO = new Date().toISOString().split("T")[0]
    const dueISO = new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]

    const draftInvoice: Partial<InvoiceItem> = {
      id: invoiceId,
      client: clientName,
      clientEmail: rawEmail,
      clientId: clientId,
      project: `${clientName} - Implementation`,
      billDate: todayISO,
      dueDate: dueISO,
      baseAmount: cleanNumeric,
      totalInvoiced: `₹${cleanNumeric.toLocaleString("en-IN")}`,
      paymentReceived: "₹0",
      due: `₹${cleanNumeric.toLocaleString("en-IN")}`,
      status: "Not paid",
      billedBy: "Automated CRM Workflow",
      companyId: effComp,
      branchId: lead.branchId,
      branchName: lead.branchName,
    }

    try {
      await addInvoice(draftInvoice as any, effComp)
    } catch (invErr) {
      console.warn("Auto-draft invoice warning:", invErr)
    }

    return { clientId, projectId, invoiceId }
  },

  /**
   * Automatically executes the Proposal Accepted workflow:
   * 1. Creates Project with milestones
   * 2. Auto-drafts Tax Invoice
   */
  async handleProposalAccepted(proposal: ProposalWorkflowData, companyId?: string): Promise<{ projectId: string; invoiceId: string }> {
    const effComp = proposal.companyId || companyId || "tech"
    const todayStr = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })
    const dueStr = new Date(Date.now() + 45 * 86400000).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })
    
    // 1. Create Project
    const createdProject = await addProject({
      title: proposal.title || `${proposal.clientName} - Project Delivery`,
      client: proposal.clientName,
      clientAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(proposal.clientName)}`,
      price: String(proposal.totalAmount || "₹50,000"),
      startDate: todayStr,
      deadline: dueStr,
      progress: 0,
      status: "In progress",
      priority: "High",
      tags: ["Accepted Proposal", "Active Contract"],
      description: `Auto-generated from Proposal #${proposal.id} accepted by client.`,
      companyId: effComp,
      branchId: proposal.branchId,
      branchName: proposal.branchName,
    } as any, effComp)

    // 2. Create Invoice
    const cleanNumeric = parseFloat(String(proposal.totalAmount || "50000").replace(/[^0-9.]/g, "")) || 50000
    const invoiceId = `INV-PROP-${Date.now().toString().slice(-5)}`
    const todayISO = new Date().toISOString().split("T")[0]
    const dueISO = new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]

    await addInvoice({
      id: invoiceId,
      client: proposal.clientName,
      clientEmail: proposal.clientEmail,
      project: proposal.title,
      billDate: todayISO,
      dueDate: dueISO,
      baseAmount: cleanNumeric,
      totalInvoiced: `₹${cleanNumeric.toLocaleString("en-IN")}`,
      paymentReceived: "₹0",
      due: `₹${cleanNumeric.toLocaleString("en-IN")}`,
      status: "Not paid",
      billedBy: "Proposal E-Sign Engine",
      companyId: effComp,
      branchId: proposal.branchId,
      branchName: proposal.branchName,
    } as any, effComp)

    return { projectId: createdProject.id, invoiceId }
  },

  /**
   * Generates a Milestone Tax Invoice directly from a project milestone
   */
  async generateMilestoneInvoice(
    projectName: string, 
    clientName: string, 
    milestoneTitle: string, 
    amount: number | string, 
    companyId?: string
  ): Promise<string> {
    const effComp = companyId || "tech"
    const cleanNumeric = parseFloat(String(amount).replace(/[^0-9.]/g, "")) || 15000
    const invoiceId = `INV-MLS-${Date.now().toString().slice(-5)}`
    const todayISO = new Date().toISOString().split("T")[0]
    const dueISO = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]

    await addInvoice({
      id: invoiceId,
      client: clientName,
      project: projectName,
      billDate: todayISO,
      dueDate: dueISO,
      baseAmount: cleanNumeric,
      totalInvoiced: `₹${cleanNumeric.toLocaleString("en-IN")}`,
      paymentReceived: "₹0",
      due: `₹${cleanNumeric.toLocaleString("en-IN")}`,
      status: "Not paid",
      billedBy: `Milestone: ${milestoneTitle}`,
      companyId: effComp,
    } as any, effComp)

    return invoiceId
  }
}
