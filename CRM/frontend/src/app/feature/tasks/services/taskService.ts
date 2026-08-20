import { Task } from "../types"
import { api } from "@/lib/api"
import { filterGlobalDeletedItems, markGlobalItemDeleted, fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"




export const initialTasks: Task[] = [
  // --- TABLE / SCREENSHOT 1 ITEMS ---
  {
    id: "3642",
    title: "Add company logo and contact details",
    startDate: "-",
    deadline: "30-06-2026",
    milestone: "Beta Release",
    relatedTo: "Business Card and Stationery Design",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    collaborators: "-",
    status: "To do",
    priority: "Normal",
    priorityIcon: "none",
    labels: [],
    points: "1 Point",
    description: "Add high-resolution vector company logo and complete contact footer details.",
  },
  {
    id: "3623",
    title: "Use VR for training and simulations",
    startDate: "-",
    deadline: "20-08-2026",
    milestone: "Beta Release",
    relatedTo: "Virtual Reality Experience Design",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    collaborators: "-",
    status: "In progress",
    priority: "High",
    priorityIcon: "up",
    labels: ["Design"],
    points: "3 Points",
    description: "Develop 3D VR simulation environment for employee onboarding.",
  },
  {
    id: "3617",
    title: "Optimize VR performance and frame rate",
    startDate: "-",
    deadline: "20-08-2026",
    milestone: "Release",
    relatedTo: "Virtual Reality Experience Design",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    collaborators: "-",
    status: "Review",
    priority: "High",
    priorityIcon: "none",
    labels: [],
    points: "5 Points",
    description: "Target solid 90fps rendering pipeline across WebXR headsets.",
  },
  {
    id: "3615",
    title: "Develop VR navigation and interactions",
    startDate: "-",
    deadline: "20-08-2026",
    milestone: "Release",
    relatedTo: "Virtual Reality Experience Design",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    collaborators: "-",
    status: "In progress",
    priority: "Urgent",
    priorityIcon: "exclamation",
    labels: ["Feedback"],
    points: "2 Points",
    description: "Implement hand tracking and controller teleportation rays.",
  },
  {
    id: "3578",
    title: "Create data dashboards and reports",
    startDate: "-",
    deadline: "20-08-2026",
    milestone: "Release",
    relatedTo: "Data Analysis and Insights",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    collaborators: "-",
    status: "Review",
    priority: "Urgent",
    priorityIcon: "exclamation",
    labels: ["Enhancement"],
    points: "3 Points",
    description: "Build realtime analytics charts with dynamic filtering options.",
  },
  {
    id: "3576",
    title: "Perform data visualization and charts",
    startDate: "-",
    deadline: "30-07-2026",
    milestone: "Beta Release",
    relatedTo: "Data Analysis and Insights",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    collaborators: "-",
    status: "Review",
    priority: "Urgent",
    priorityIcon: "exclamation",
    labels: [],
    points: "2 Points",
    description: "Refactor Chart.js line charts for high density data series.",
  },
  {
    id: "3571",
    title: "Implement product barcodes and labels",
    startDate: "-",
    deadline: "07-07-2026",
    milestone: "Beta Release",
    relatedTo: "Product Packaging Design",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    collaborators: "-",
    status: "To do",
    priority: "Normal",
    priorityIcon: "none",
    labels: [],
    points: "1 Point",
    description: "Generate EAN-13 barcodes for physical merchandise packaging.",
  },
  {
    id: "3570",
    title: "Test packaging durability and usability",
    startDate: "-",
    deadline: "07-07-2026",
    milestone: "Beta Release",
    relatedTo: "Product Packaging Design",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    collaborators: "-",
    status: "In progress",
    priority: "Normal",
    priorityIcon: "none",
    labels: [],
    points: "2 Points",
    description: "Stress test eco-friendly box materials under moisture and drop conditions.",
  },
  {
    id: "3546",
    title: "A/B test ad variations",
    startDate: "-",
    deadline: "09-07-2026",
    milestone: "Beta Release",
    relatedTo: "Copywriting for Advertisements",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    collaborators: "-",
    status: "In progress",
    priority: "Normal",
    priorityIcon: "none",
    labels: [],
    points: "1 Point",
    description: "Run split test on Google Search Headlines vs Facebook Carousel Ads.",
  },

  // --- KANBAN / SCREENSHOT 2 ITEMS ---
  {
    id: "3435",
    title: "Measure influencer campaign success",
    startDate: "01-08-2026",
    deadline: "15-08-2026",
    milestone: "Beta Release",
    relatedTo: "Influencer Marketing",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    status: "To do",
    priority: "High",
    priorityIcon: "up",
    labels: [],
  },
  {
    id: "3329",
    title: "Proofread and edit blog posts",
    startDate: "02-08-2026",
    deadline: "18-08-2026",
    milestone: "Beta Release",
    relatedTo: "Content Writing",
    assignedTo: "Michael Lee",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=MichaelLee",
    status: "To do",
    priority: "Low",
    priorityIcon: "down",
    labels: ["Enhancement"],
  },
  {
    id: "3517",
    title: "Sketch and outline illustrations",
    startDate: "03-08-2026",
    deadline: "22-08-2026",
    milestone: "Release",
    relatedTo: "UI/UX Design",
    assignedTo: "Mark Smith",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=MarkSmith",
    status: "To do",
    priority: "High",
    priorityIcon: "up",
    labels: [],
  },
  {
    id: "3432",
    title: "Track influencer performance and reach",
    startDate: "04-08-2026",
    deadline: "25-08-2026",
    milestone: "Beta Release",
    relatedTo: "Influencer Marketing",
    assignedTo: "Daniel White",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=DanielWhite",
    status: "To do",
    priority: "High",
    priorityIcon: "up",
    labels: [],
  },
  {
    id: "3530",
    title: "Design game characters and assets",
    startDate: "05-08-2026",
    deadline: "28-08-2026",
    milestone: "Release",
    relatedTo: "Game Development",
    assignedTo: "Ethan Anderson",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=EthanAnderson",
    status: "To do",
    priority: "Urgent",
    priorityIcon: "none",
    labels: ["Bug"],
  },
  {
    id: "3381",
    title: "Create promotional banners",
    startDate: "06-08-2026",
    deadline: "30-08-2026",
    milestone: "Release",
    relatedTo: "Graphic Design",
    assignedTo: "Olivia Brown",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=OliviaBrown",
    status: "To do",
    priority: "Normal",
    priorityIcon: "none",
    labels: [],
  },
  {
    id: "3290",
    title: "Submit app to app stores for release",
    startDate: "01-08-2026",
    deadline: "10-08-2026",
    milestone: "Release",
    relatedTo: "Mobile App Development",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    status: "In progress",
    priority: "Urgent",
    priorityIcon: "exclamation",
    labels: ["Bug"],
  },
  {
    id: "3319",
    title: "Design brand packaging and labels",
    startDate: "02-08-2026",
    deadline: "12-08-2026",
    milestone: "Beta Release",
    relatedTo: "Product Packaging Design",
    assignedTo: "Michael Lee",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=MichaelLee",
    status: "In progress",
    priority: "Urgent",
    priorityIcon: "none",
    labels: ["Bug"],
  },
  {
    id: "3511",
    title: "Create website backups and restore points",
    startDate: "03-08-2026",
    deadline: "15-08-2026",
    milestone: "Release",
    relatedTo: "Website Maintenance",
    assignedTo: "Mark Smith",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=MarkSmith",
    status: "In progress",
    priority: "Low",
    priorityIcon: "down",
    labels: ["Enhancement"],
  },
  {
    id: "3336",
    title: "Research and write industry reports and case studies",
    startDate: "01-08-2026",
    deadline: "20-08-2026",
    milestone: "Release",
    relatedTo: "Market Research",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    status: "Review",
    priority: "Normal",
    priorityIcon: "none",
    labels: [],
  },
  {
    id: "3326",
    title: "Write SEO-friendly blog articles",
    startDate: "02-08-2026",
    deadline: "22-08-2026",
    milestone: "Beta Release",
    relatedTo: "SEO Services",
    assignedTo: "Michael Lee",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=MichaelLee",
    status: "Review",
    priority: "Low",
    priorityIcon: "down",
    labels: ["Enhancement"],
  },
  {
    id: "3314",
    title: "Design brand logo and tagline",
    startDate: "04-08-2026",
    deadline: "25-08-2026",
    milestone: "Release",
    relatedTo: "Branding",
    assignedTo: "Ethan Anderson",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=EthanAnderson",
    status: "Review",
    priority: "Low",
    priorityIcon: "down",
    labels: ["Design"],
  },
  {
    id: "3524",
    title: "Implement illustrations on digital platforms",
    startDate: "05-08-2026",
    deadline: "26-08-2026",
    milestone: "Release",
    relatedTo: "Digital Marketing",
    assignedTo: "Olivia Brown",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=OliviaBrown",
    status: "Review",
    priority: "Normal",
    priorityIcon: "none",
    labels: [],
  },
  {
    id: "3591",
    title: "Present data insights through infographics",
    startDate: "01-08-2026",
    deadline: "10-08-2026",
    milestone: "Release",
    relatedTo: "Data Analysis and Insights",
    assignedTo: "John Doe",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe",
    status: "Done",
    priority: "Normal",
    priorityIcon: "none",
    labels: ["Feedback"],
  },
  {
    id: "3386",
    title: "Prepare artwork for print production",
    startDate: "02-08-2026",
    deadline: "12-08-2026",
    milestone: "Release",
    relatedTo: "Print Production",
    assignedTo: "Michael Lee",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=MichaelLee",
    status: "Done",
    priority: "Normal",
    priorityIcon: "none",
    labels: [],
  },
  {
    id: "3305",
    title: "Write engaging content for posts",
    startDate: "03-08-2026",
    deadline: "14-08-2026",
    milestone: "Beta Release",
    relatedTo: "Social Media",
    assignedTo: "Daniel White",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=DanielWhite",
    status: "Done",
    priority: "Urgent",
    priorityIcon: "exclamation",
    labels: [],
  },
  {
    id: "3538",
    title: "Design game splash screen and icons",
    startDate: "04-08-2026",
    deadline: "16-08-2026",
    milestone: "Release",
    relatedTo: "Game Development",
    assignedTo: "Ethan Anderson",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=EthanAnderson",
    status: "Done",
    priority: "Low",
    priorityIcon: "none",
    labels: ["Enhancement"],
  },
  {
    id: "3604",
    title: "Publish podcast episodes on hosting platforms",
    startDate: "05-08-2026",
    deadline: "18-08-2026",
    milestone: "Release",
    relatedTo: "Podcast Marketing",
    assignedTo: "Olivia Brown",
    assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=OliviaBrown",
    status: "Done",
    priority: "Normal",
    priorityIcon: "none",
    labels: [],
  },
  {
    id: "3498",
    title: "Prepare logo style guide",
    startDate: "06-08-2026",
    deadline: "20-08-2026",
    milestone: "Beta Release",
    relatedTo: "Branding",
    assignedTo: "Sara Ann",
    status: "Done",
    priority: "Normal",
    priorityIcon: "none",
    labels: [],
  },

]

const TASKS_STORAGE_KEY = "saampark_tasks_store"






function getPersistedTasks(): Task[] {
  if (typeof window === "undefined") return filterGlobalDeletedItems([...initialTasks])
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY)
    let list: Task[] = raw ? JSON.parse(raw) : [...initialTasks]
    if (!Array.isArray(list) || list.length === 0) list = [...initialTasks]
    return filterGlobalDeletedItems(list)
  } catch {
    return filterGlobalDeletedItems([...initialTasks])
  }
}

function savePersistedTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
    saveModuleDataToDB("tasks", tasks)
  } catch {}
}

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    const dbData = await fetchModuleDataFromDB<Task[]>("tasks", initialTasks)
    if (Array.isArray(dbData) && dbData.length > 0) {
      return dbData
    }
    return filterGlobalDeletedItems([...initialTasks])
  },

  addTask: async (taskData: Omit<Task, "id">): Promise<Task> => {
    // Always read current list from DB to ensure cross-device consistency
    const current = await fetchModuleDataFromDB<Task[]>("tasks", initialTasks)
    const nextId = (3650 + current.length + Math.floor(Math.random() * 100)).toString()
    const newTask: Task = { ...taskData, id: nextId }
    const updated = [newTask, ...current]
    await saveModuleDataToDB("tasks", updated)
    return newTask
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const current = await fetchModuleDataFromDB<Task[]>("tasks", initialTasks)
    const idx = current.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error("Task not found")
    current[idx] = { ...current[idx], ...updates }
    await saveModuleDataToDB("tasks", current)
    return { ...current[idx] }
  },

  deleteTask: async (id: string): Promise<void> => {
    await markGlobalItemDeleted(id, "tasks")
    const current = await fetchModuleDataFromDB<Task[]>("tasks", initialTasks)
    const filtered = current.filter((t) => t.id !== id)
    await saveModuleDataToDB("tasks", filtered)
  },
}





