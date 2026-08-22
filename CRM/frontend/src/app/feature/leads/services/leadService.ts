import { Lead } from "../types"
import { api } from "@/lib/api"


export const initialLeads: Lead[] = [
  // --- COLUMN: NEW ---
  {
    id: "1",
    type: "Person",
    name: "Sarah Cole",
    primaryContact: "Sarah Cole",
    phone: "+91 98123 45678",
    service: "Google My Business",
    reminderDate: "12 Aug 2025",
    reminderNotes: "Follow up regarding GMB verification code",
    owner: "John Doe",
    caller: "John Doe",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=SarahCole",
    labels: ["Call this week"],
    createdAt: "06 Aug 2025",
    status: "New",
    source: "Google",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    value: "₹1,50,000",
  },
  {
    id: "2",
    type: "Person",
    name: "Jaylin Sawayn",
    primaryContact: "Jaylin Sawayn",
    phone: "+91 91234 56789",
    service: "Google Ads",
    reminderDate: "13 Aug 2025",
    reminderNotes: "Discuss monthly ad budget increase",
    owner: "Mark Smith",
    caller: "Mark Smith",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Jaylin",
    labels: ["Call this week"],
    createdAt: "05 Aug 2025",
    status: "New",
    source: "Google Ads",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    value: "₹2,00,000",
  },
  {
    id: "3",
    type: "Organization",
    name: "Ferry, Price and Carter",
    primaryContact: "Ferry Executive",
    phone: "+91 99887 66554",
    service: "Google My Business",
    reminderDate: "10 Aug 2025",
    reminderNotes: "Send proposal draft for multi-location GMB",
    owner: "Olivia Brown",
    caller: "Olivia Brown",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Ferry",
    labels: ["Corporate"],
    createdAt: "05 Aug 2025",
    status: "New",
    source: "Site",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    value: "₹3,50,000",
  },
  {
    id: "4",
    type: "Organization",
    name: "Hickle LLC",
    primaryContact: "Hickle Admin",
    phone: "+91 90011 22334",
    service: "Google Ads",
    reminderDate: "09 Aug 2025",
    reminderNotes: "Client requested ROI performance report",
    owner: "James Wilson",
    caller: "James Wilson",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Hickle",
    labels: ["Potential"],
    createdAt: "04 Aug 2025",
    status: "New",
    source: "Facebook",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    value: "₹1,80,000",
  },
  {
    id: "5",
    type: "Person",
    name: "Eldora Strosin",
    primaryContact: "Eldora Strosin",
    phone: "+91 98330 11223",
    service: "Google My Business",
    reminderDate: "08 Aug 2025",
    reminderNotes: "Schedule onboarding call",
    owner: "Sarah Connor",
    caller: "Sarah Connor",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Eldora",
    labels: ["Call this week"],
    createdAt: "03 Aug 2025",
    status: "New",
    source: "Youtube",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    value: "₹95,000",
  },

  // --- COLUMN: QUALIFIED ---
  {
    id: "6",
    type: "Person",
    name: "Louie Ziemann",
    primaryContact: "Louie Ziemann",
    phone: "+91 98123 45678",
    service: "Google Ads",
    reminderDate: "13 Aug 2025",
    reminderNotes: "Review campaign target audience parameters",
    owner: "Michael Lee",
    caller: "Michael Lee",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Louie",
    labels: ["50% Probability"],
    createdAt: "05 Aug 2025",
    status: "Qualified",
    probability: 50,
    source: "Site",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    value: "₹2,20,000",
  },
  {
    id: "7",
    type: "Person",
    name: "Geraldine Reichel",
    primaryContact: "Geraldine Reichel",
    phone: "+91 97000 44556",
    service: "Google My Business",
    reminderDate: "12 Aug 2025",
    reminderNotes: "Call regarding local SEO optimization package",
    owner: "David Miller",
    caller: "David Miller",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Geraldine",
    labels: ["Qualified"],
    createdAt: "04 Aug 2025",
    status: "Qualified",
    probability: 50,
    source: "Google",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    value: "₹1,40,000",
  },
  {
    id: "8",
    type: "Person",
    name: "Nola Bauch",
    primaryContact: "Nola Bauch",
    phone: "+91 95555 66778",
    service: "Google Ads",
    reminderDate: "11 Aug 2025",
    reminderNotes: "Send updated contract details",
    owner: "Emma Davis",
    caller: "Emma Davis",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Nola",
    labels: ["Call this week"],
    createdAt: "04 Aug 2025",
    status: "Qualified",
    probability: 50,
    source: "Twitter",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    value: "₹1,90,000",
  },
  {
    id: "9",
    type: "Person",
    name: "Hulda Nader",
    primaryContact: "Hulda Nader",
    phone: "+91 94444 88990",
    service: "Google My Business",
    reminderDate: "10 Aug 2025",
    reminderNotes: "Confirm review response strategy",
    owner: "Liam Johnson",
    caller: "Liam Johnson",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Hulda",
    labels: ["Referral"],
    createdAt: "03 Aug 2025",
    status: "Qualified",
    probability: 50,
    source: "Elsewhere",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    value: "₹1,10,000",
  },
  {
    id: "10",
    type: "Organization",
    name: "Brown, Goyette and Gusikowski",
    primaryContact: "Gusikowski Rep",
    phone: "+91 93333 44556",
    service: "Google Ads",
    reminderDate: "18 Aug 2026",
    reminderTime: "10:00 AM",
    reminderNotes: "Demo call for search ads setup",
    owner: "Sophia Martinez",
    caller: "Sophia Martinez",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Brown",
    labels: ["Satisfied"],
    createdAt: "02 Aug 2025",
    status: "New",
    probability: 50,
    source: "Site",
    city: "Surat",
    state: "Gujarat",
    country: "India",
    value: "₹4,10,000",
    isLocked: true,
    lockedReason: "Telecaller missed follow-up SLA today (18 Aug 2026)",
  },

  // --- COLUMN: DISCUSSION ---
  {
    id: "11",
    type: "Organization",
    name: "Gibson PLC",
    primaryContact: "Gibson Manager",
    phone: "+91 98222 33445",
    service: "Google My Business",
    reminderDate: "13 Aug 2025",
    reminderNotes: "Discuss annual GMB management pricing",
    owner: "Daniel White",
    caller: "Daniel White",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Gibson",
    labels: ["Discussion"],
    createdAt: "06 Aug 2025",
    status: "Discussion",
    source: "Google",
    city: "Gurgaon",
    state: "Haryana",
    country: "India",
    value: "₹3,20,000",
  },
  {
    id: "12",
    type: "Person",
    name: "Jada Nienow",
    primaryContact: "Jada Nienow",
    phone: "+91 97777 88991",
    service: "Google Ads",
    reminderDate: "12 Aug 2025",
    reminderNotes: "Finalize keyword bidding strategy",
    owner: "Henry Clark",
    caller: "Henry Clark",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Jada",
    labels: ["90% Probability"],
    createdAt: "05 Aug 2025",
    status: "Discussion",
    probability: 90,
    source: "Facebook",
    city: "Noida",
    state: "Uttar Pradesh",
    country: "India",
    value: "₹2,60,000",
  },
  {
    id: "13",
    type: "Person",
    name: "Percival Witting",
    primaryContact: "Percival Witting",
    phone: "+91 96666 11223",
    service: "Google My Business",
    reminderDate: "11 Aug 2025",
    reminderNotes: "Call regarding local citations build-out",
    owner: "Charlotte King",
    caller: "Charlotte King",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Percival",
    labels: ["Call this week"],
    createdAt: "04 Aug 2025",
    status: "Discussion",
    source: "Site",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    value: "₹1,75,000",
  },
  {
    id: "14",
    type: "Person",
    name: "Layla Mrazar",
    primaryContact: "Layla Mrazar",
    phone: "+91 91111 22345",
    service: "Google Ads",
    reminderDate: "10 Aug 2025",
    reminderNotes: "Review landing page conversion rate",
    owner: "Benjamin Scott",
    caller: "Benjamin Scott",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Layla",
    labels: ["Discussion"],
    createdAt: "04 Aug 2025",
    status: "Discussion",
    source: "Twitter",
    city: "Chandigarh",
    state: "Punjab",
    country: "India",
    value: "₹2,10,000",
  },
  {
    id: "15",
    type: "Person",
    name: "Rosemary Muller",
    primaryContact: "Rosemary Muller",
    phone: "+91 92222 33455",
    service: "Google My Business",
    reminderDate: "10 Aug 2025",
    reminderNotes: "Schedule follow up review meeting",
    owner: "William Taylor",
    caller: "William Taylor",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Rosemary",
    labels: ["Call this week"],
    createdAt: "03 Aug 2025",
    status: "Discussion",
    source: "Google",
    city: "Indore",
    state: "Madhya Pradesh",
    country: "India",
    value: "₹1,30,000",
  },

  // --- COLUMN: NEGOTIATION ---
  {
    id: "16",
    type: "Organization",
    name: "Hegmann-Muller",
    primaryContact: "Hegmann Admin",
    phone: "+91 98888 77665",
    service: "Google Ads",
    reminderDate: "14 Aug 2025",
    reminderNotes: "Negotiating SLA terms & monthly retainer discount",
    owner: "Ethan Anderson",
    caller: "Ethan Anderson",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Hegmann",
    labels: ["90% Probability"],
    createdAt: "06 Aug 2025",
    status: "Negotiation",
    probability: 90,
    source: "Site",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    value: "₹4,80,000",
  },
  {
    id: "17",
    type: "Person",
    name: "Cielo Labadie",
    primaryContact: "Cielo Labadie",
    phone: "+91 93300 55667",
    service: "Google My Business",
    reminderDate: "13 Aug 2025",
    reminderNotes: "Awaiting final approval from client CFO",
    owner: "Ava Thomas",
    caller: "Ava Thomas",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Cielo",
    labels: ["90% Probability"],
    createdAt: "05 Aug 2025",
    status: "Negotiation",
    probability: 90,
    source: "Google",
    city: "Bhopal",
    state: "Madhya Pradesh",
    country: "India",
    value: "₹2,75,000",
  },

  // --- COLUMN: STORE VISIT ---
  {
    id: "101",
    type: "Organization",
    name: "Vanguard Tech Solutions",
    primaryContact: "Rohit Verma",
    phone: "+91 98765 11223",
    service: "Google My Business",
    reminderDate: "16 Aug 2025",
    reminderNotes: "Scheduled retail outlet walkthrough and store visit audit",
    owner: "John Doe",
    caller: "John Doe",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Rohit",
    labels: ["Store Visit"],
    createdAt: "07 Aug 2025",
    status: "Store Visit",
    source: "Site",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    value: "₹3,40,000",
  },
  {
    id: "102",
    type: "Person",
    name: "Karan Johar Enterprises",
    primaryContact: "Karan Johar",
    phone: "+91 98111 88990",
    service: "Google Ads",
    reminderDate: "15 Aug 2025",
    reminderNotes: "On-site store inspection for campaign signage setup",
    owner: "Mark Smith",
    caller: "Mark Smith",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Karan",
    labels: ["Store Visit"],
    createdAt: "06 Aug 2025",
    status: "Store Visit",
    source: "Google",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    value: "₹2,15,000",
  },

  // --- COLUMN: THEY COME TO OUR OFFICE ---
  {
    id: "103",
    type: "Organization",
    name: "Apex Global Research",
    primaryContact: "Ananya Roy",
    phone: "+91 98222 99001",
    service: "SEO Services",
    reminderDate: "17 Aug 2025",
    reminderNotes: "Client visiting our Head Office conference room for contract signing",
    owner: "Michael Lee",
    caller: "Michael Lee",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Ananya",
    labels: ["They come to our office"],
    createdAt: "07 Aug 2025",
    status: "They come to our office",
    source: "Google Ads",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    value: "₹5,50,000",
  },
  {
    id: "104",
    type: "Person",
    name: "Vikramaditya Sharma",
    primaryContact: "Vikramaditya Sharma",
    phone: "+91 98333 44556",
    service: "Website Development",
    reminderDate: "16 Aug 2025",
    reminderNotes: "Office meeting scheduled at 3:00 PM with tech team",
    owner: "Daniel White",
    caller: "Daniel White",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Vikram",
    labels: ["They come to our office"],
    createdAt: "05 Aug 2025",
    status: "They come to our office",
    source: "Referral",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    value: "₹4,20,000",
  },
  {
    id: "18",
    type: "Organization",
    name: "Hegmann, Johns and Ankunding",
    primaryContact: "Ankunding Executive",
    phone: "+91 94400 66778",
    service: "Google Ads",
    reminderDate: "12 Aug 2025",
    reminderNotes: "Send updated invoice & agreement terms",
    owner: "Noah Harris",
    caller: "Noah Harris",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Ankunding",
    labels: ["Negotiation"],
    createdAt: "04 Aug 2025",
    status: "Negotiation",
    source: "Facebook",
    city: "Nagpur",
    state: "Maharashtra",
    country: "India",
    value: "₹3,90,000",
  },
  {
    id: "19",
    type: "Organization",
    name: "Cummerata, Aufderhar and Bergnaum",
    primaryContact: "Bergnaum Director",
    phone: "+91 96600 88991",
    service: "Google My Business",
    reminderDate: "11 Aug 2025",
    reminderNotes: "Finalizing contract scope for 15 locations",
    owner: "Isabella Martin",
    caller: "Isabella Martin",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Cummerata",
    labels: ["Negotiation"],
    createdAt: "04 Aug 2025",
    status: "Negotiation",
    source: "Elsewhere",
    city: "Kochi",
    state: "Kerala",
    country: "India",
    value: "₹5,20,000",
  },
  {
    id: "20",
    type: "Person",
    name: "Mireille Crist",
    primaryContact: "Mireille Crist",
    phone: "+91 95500 11223",
    service: "Google Ads",
    reminderDate: "10 Aug 2025",
    reminderNotes: "Client requested 5% discount on quarterly package",
    owner: "Lucas Thompson",
    caller: "Lucas Thompson",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Mireille",
    labels: ["Call this week"],
    createdAt: "03 Aug 2025",
    status: "Negotiation",
    source: "Google",
    city: "Coimbatore",
    state: "Tamil Nadu",
    country: "India",
    value: "₹2,40,000",
  },

  // --- COLUMN: WON ---
  {
    id: "21",
    type: "Person",
    name: "Zachary Baahan",
    primaryContact: "Zachary Baahan",
    phone: "+91 99111 22334",
    service: "Google My Business",
    reminderDate: "15 Aug 2025",
    reminderNotes: "Deal closed! Kickoff meeting scheduled",
    owner: "Oliver Robinson",
    caller: "Oliver Robinson",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Zachary",
    labels: ["Satisfied"],
    createdAt: "06 Aug 2025",
    status: "Won",
    source: "Google",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    value: "₹6,00,000",
  },
  {
    id: "22",
    type: "Person",
    name: "Marlou Leannon",
    primaryContact: "Marlou Leannon",
    phone: "+91 98100 33445",
    service: "Google Ads",
    reminderDate: "14 Aug 2025",
    reminderNotes: "Payment received. Campaign setup in progress",
    owner: "Mia Lewis",
    caller: "Mia Lewis",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Marlou",
    labels: ["Won"],
    createdAt: "05 Aug 2025",
    status: "Won",
    source: "Site",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    value: "₹3,80,000",
  },
  {
    id: "23",
    type: "Person",
    name: "Fleta Brekke",
    primaryContact: "Fleta Brekke",
    phone: "+91 97400 55678",
    service: "Google My Business",
    reminderDate: "13 Aug 2025",
    reminderNotes: "Initial audit report delivered to client",
    owner: "Elijah Walker",
    caller: "Elijah Walker",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Fleta",
    labels: ["Won"],
    createdAt: "04 Aug 2025",
    status: "Won",
    source: "Facebook",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    value: "₹2,90,000",
  },
  {
    id: "24",
    type: "Person",
    name: "Pat Haley",
    primaryContact: "Pat Haley",
    phone: "+91 96200 77889",
    service: "Google Ads",
    reminderDate: "12 Aug 2025",
    reminderNotes: "Ad graphics & copy approved",
    owner: "Amelia Hall",
    caller: "Amelia Hall",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Pat",
    labels: ["Won"],
    createdAt: "04 Aug 2025",
    status: "Won",
    source: "Google",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    value: "₹4,50,000",
  },
  {
    id: "25",
    type: "Organization",
    name: "Lynch-Quigley",
    primaryContact: "Lynch Director",
    phone: "+91 95000 88990",
    service: "Google My Business",
    reminderDate: "11 Aug 2025",
    reminderNotes: "Monthly reporting dashboard configured",
    owner: "James Young",
    caller: "James Young",
    ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Lynch",
    labels: ["Won"],
    createdAt: "03 Aug 2025",
    status: "Won",
    source: "Elsewhere",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    value: "₹3,10,000",
  },
]

import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"


const LEADS_STORAGE_KEY = "saampark_leads_store"

function getPersistedLeads(): Lead[] {
  if (typeof window === "undefined") return filterGlobalDeletedItems([...initialLeads])
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY)
    let list: Lead[] = raw ? JSON.parse(raw) : [...initialLeads]
    if (!Array.isArray(list) || list.length === 0) list = [...initialLeads]
    return filterGlobalDeletedItems(list)
  } catch {
    return filterGlobalDeletedItems([...initialLeads])
  }
}

// Helper to check if a reminder date is in the past (< today)
function isReminderDateOverdue(dateStr?: string): boolean {
  if (!dateStr) return false
  const lower = dateStr.toString().toLowerCase().trim()
  if (
    lower === "none" ||
    lower === "00,00,0000" ||
    lower === "00-00-0000" ||
    lower === "00/00/0000" ||
    lower === "00.00.0000" ||
    lower === "-"
  ) {
    return false
  }
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const parsed = new Date(dateStr)
    if (isNaN(parsed.getTime())) return false
    parsed.setHours(0, 0, 0, 0)
    return parsed.getTime() < today.getTime()
  } catch {
    return false
  }
}

import { taskService } from "../../tasks/services/taskService"

export async function syncLeadReminderTask(lead: Lead): Promise<void> {
  if (!lead || !lead.name) return
  const rDate = (lead.reminderDate || "").toString().toLowerCase().trim()
  if (!rDate || rDate === "none" || rDate === "00,00,0000" || rDate === "00-00-0000" || rDate === "00/00/0000") {
    return
  }

  const assignedTo = lead.caller || lead.owner || "Team"
  const taskId = `lead_task_${lead.id}`

  try {
    const existingTasks = await taskService.getTasks()
    const found = existingTasks.find((t) => t.id === taskId || t.id === `task_${lead.id}` || t.relatedTo === `Lead: ${lead.name}`)

    const taskTitle = `Follow-up Call: ${lead.name}`
    const deadlineVal = `${lead.reminderDate}${lead.reminderTime ? ` (${lead.reminderTime})` : ''}`
    const isDone = lead.status === "Won" || lead.status === "Lost"
    const desc = `Primary Contact: ${lead.primaryContact || lead.name}. Phone: ${lead.phone || 'N/A'}. Services: ${lead.service || 'N/A'}. Notes: ${lead.reminderNotes || 'Follow up call scheduled'}`

    if (found) {
      await taskService.updateTask(found.id, {
        title: taskTitle,
        assignedTo,
        deadline: deadlineVal,
        description: desc,
        status: isDone ? "Done" : (found.status || "To do"),
        priority: "High",
      })
    } else {
      await taskService.addTask({
        id: taskId,
        title: taskTitle,
        startDate: lead.createdAt || new Date().toISOString().split("T")[0],
        deadline: deadlineVal,
        milestone: "Lead Follow-up",
        relatedTo: `Lead: ${lead.name}`,
        assignedTo,
        assignedToAvatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${assignedTo}`,
        collaborators: "-",
        status: isDone ? "Done" : "To do",
        priority: "High",
        priorityIcon: "up",
        labels: ["Follow-up"],
        points: "2 Points",
        description: desc,
      } as any)
    }
  } catch (err) {
    console.warn("Sync lead reminder task warning:", err)
  }
}

export const getLeads = async (): Promise<Lead[]> => {
  const dbData = await fetchModuleDataFromDB<Lead[]>("leads", [])
  const list = Array.isArray(dbData) ? dbData : []

  // Auto-lock leads if daily update or reminder date was missed (overdue)
  let hasChanges = false
  const processed = list.map((lead) => {
    if (
      !lead.isLocked &&
      lead.status !== "Won" &&
      lead.status !== "Lost" &&
      isReminderDateOverdue(lead.reminderDate)
    ) {
      hasChanges = true
      return {
        ...lead,
        isLocked: true,
        lockedReason: "Overdue: Lead status or reminder date was not updated daily by caller.",
      }
    }
    return lead
  })

  if (hasChanges) {
    saveModuleDataToDB("leads", processed)
  }

  // Asynchronously sync valid lead call reminders to Tasks
  processed.forEach((lead) => {
    if (lead.reminderDate && lead.caller) {
      syncLeadReminderTask(lead).catch(() => {})
    }
  })

  return processed
}

import { saveStoredClient, getStoredClients } from "../../clients/services/clientService"
import { recordUserAccount } from "../../users/services/userService"

export async function checkAndAutoConvertLeadToClient(lead: Lead): Promise<void> {
  if (!lead || lead.status !== "Won") return

  try {
    const storedClients = getStoredClients()
    const emailNorm = (lead.email || `lead_${lead.id}@saampark.in`).toLowerCase().trim()
    const clientName = lead.name || "Won Client"

    const exists = storedClients.some(
      (c) => c.name.toLowerCase().trim() === clientName.toLowerCase().trim() || c.email?.toLowerCase().trim() === emailNorm
    )

    if (!exists) {
      const newClient = {
        id: `cli_${lead.id}`,
        name: clientName,
        primaryContact: lead.primaryContact || lead.name,
        email: emailNorm,
        phone: lead.phone || "N/A",
        group: "VIP",
        label: lead.service || "Potential",
        labelColor: "#3b82f6",
        projectsCount: 0,
        totalInvoiced: lead.value || "₹0",
        paymentReceived: "₹0",
        due: lead.value || "₹0",
        address: `${lead.city || ""}, ${lead.state || ""}, ${lead.country || ""}`.trim(),
      }

      saveStoredClient(newClient as any)

      // Register client account for login
      recordUserAccount({
        id: `usr_cli_${lead.id}`,
        name: lead.primaryContact || lead.name,
        email: emailNorm,
        role: "Clients",
        companyId: "tech",
        companyName: clientName,
        phone: lead.phone,
        password: "Password123",
        status: "Active",
      }, true)
    }
  } catch (err) {
    console.warn("Auto-convert lead to client error:", err)
  }
}

export const addLead = async (leadData: Omit<Lead, "id">): Promise<Lead> => {
  const current = await fetchModuleDataFromDB<Lead[]>("leads", [])
  const maxNum = Math.max(100, ...current.map((l) => parseInt(l.id) || 0))
  const newId = (maxNum > 0 ? maxNum + 1 : Date.now()).toString()
  
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultFutureReminderDate = tomorrow.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })

  const newLead: Lead = {
    ...leadData,
    id: newId,
    createdAt: leadData.createdAt || `${new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}`,
    service: leadData.service || "Website Development",
    source: leadData.source || "Social Media",
    reminderDate: leadData.reminderDate || defaultFutureReminderDate,
    reminderNotes: leadData.reminderNotes || "Follow up call scheduled",
    caller: leadData.caller || leadData.owner || "Team",
    isLocked: false,
  }
  const updated = [newLead, ...current]
  await saveModuleDataToDB("leads", updated)
  syncLeadReminderTask(newLead)
  checkAndAutoConvertLeadToClient(newLead)
  return newLead
}

export const updateLead = async (id: string, updates: Partial<Lead>, userRole?: string): Promise<Lead> => {
  const current = await fetchModuleDataFromDB<Lead[]>("leads", [])
  const idx = current.findIndex((l) => l.id === id)
  if (idx === -1) throw new Error("Lead not found")

  const target = current[idx]
  const isSuperOrAdmin = userRole === "Super Admin" || userRole === "Admin"

  // Prevent callers/teams from updating a locked lead unless being explicitly unlocked by Admin
  if (target.isLocked && !isSuperOrAdmin && updates.isLocked !== false) {
    throw new Error("This lead is locked due to missing daily updates. Only an Admin or Super Admin can unlock it.")
  }

  // If status or reminderDate is updated to future, clear auto-lock
  let nextIsLocked = updates.isLocked !== undefined ? updates.isLocked : target.isLocked
  let nextReason = updates.lockedReason !== undefined ? updates.lockedReason : target.lockedReason

  if (updates.reminderDate && !isReminderDateOverdue(updates.reminderDate)) {
    nextIsLocked = false
    nextReason = undefined
  }

  current[idx] = {
    ...target,
    ...updates,
    isLocked: nextIsLocked,
    lockedReason: nextReason,
  }

  await saveModuleDataToDB("leads", current)
  syncLeadReminderTask(current[idx])
  checkAndAutoConvertLeadToClient(current[idx])
  return { ...current[idx] }
}

export const deleteLead = async (id: string): Promise<boolean> => {
  await markGlobalItemDeleted(id, "leads")
  const current = await fetchModuleDataFromDB<Lead[]>("leads", [])
  const filtered = current.filter((l) => l.id !== id)
  await saveModuleDataToDB("leads", filtered)
  return true
}

export const unlockLead = async (id: string): Promise<Lead> => {
  // Automatically advance reminderDate to Tomorrow so background overdue check doesn't immediately re-lock it
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const formattedTomorrow = tomorrow.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })

  return updateLead(
    id,
    {
      isLocked: false,
      lockedReason: undefined,
      reminderDate: formattedTomorrow,
    },
    "Super Admin"
  )
}

export const lockLead = async (id: string, reason?: string): Promise<Lead> => {
  return updateLead(id, { isLocked: true, lockedReason: reason || "Manually locked by Admin" }, "Super Admin")
}



