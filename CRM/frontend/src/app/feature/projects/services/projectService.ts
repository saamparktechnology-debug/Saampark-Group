import { Project } from "../types"

export const initialProjects: Project[] = [
  {
    id: "17",
    title: "WordPress Plugin Development",
    projectType: "Internal Project",
    client: "-",
    price: "-",
    startDate: "20-06-2026",
    deadline: "08-08-2026",
    progress: 29,
    status: "Open",
    labels: ["Urgent"],
    starred: true,
    totalHours: 37.08,
    description: "Ratione sint dolores mollitia a voluptatem. Aut earum molestias aut beatae tenetur quia. Aspernatur natus minima aperiam in temporibus. Aut dolorum pariatur ea architecto. Qui nostrum cupiditate et dignissimos. Sint cum ducimus at rem. Nostrum inventore repellendus quibusdam accusantium dolor. Iste eaque quo unde quasi dolor.",
    members: [
      { id: "m1", name: "John Doe", role: "Admin", email: "john@saampark.com" },
      { id: "m2", name: "Mark Thomas", role: "Web Developer", email: "mark@saampark.com" },
      { id: "m3", name: "Michael Wood", role: "Project Manager", email: "michael@saampark.com" },
    ],
    taskBreakdown: {
      todo: 2,
      inProgress: 4,
      review: 1,
      done: 3,
    },
    activityLogs: [
      { id: "a1", user: "John Doe", timestamp: "Today at 08:09:56 am", action: "Added", title: "Develop plugin documentation", badge: "Task: #3483" },
      { id: "a2", user: "John Doe", timestamp: "Today at 08:09:56 am", action: "Added", title: "Add plugin localization and translation", badge: "Task: #3484" },
      { id: "a3", user: "John Doe", timestamp: "Today at 08:08:56 am", action: "Added", title: "Submit plugin to WordPress repository", badge: "Task: #3485" },
      { id: "a4", user: "John Doe", timestamp: "Today at 08:09:56 am", action: "Added", title: "Provide plugin customer support", badge: "Task: #3486" },
      { id: "a5", user: "John Doe", timestamp: "Today at 08:09:56 am", action: "Added", title: "Implement plugin analytics and tracking", badge: "Task: #3487" },
      { id: "a6", user: "John Doe", timestamp: "Today at 08:09:55 am", action: "Added", title: "Create plugin wireframes and UI", badge: "Task: #3475" },
      { id: "a7", user: "John Doe", timestamp: "Today at 08:09:55 am", action: "Added", title: "Develop plugin core features", badge: "Task: #3476" },
    ],
  },
  {
    id: "19",
    title: "Website Maintenance and Updates",
    projectType: "Client Project",
    client: "Birdie Erdman",
    price: "$3,500.00",
    startDate: "08-07-2026",
    deadline: "12-08-2026",
    progress: 15,
    status: "Open",
    labels: ["Urgent"],
    totalHours: 12.5,
    members: [
      { id: "m1", name: "John Doe", role: "Admin" },
      { id: "m2", name: "Mark Thomas", role: "Web Developer" },
    ],
    taskBreakdown: { todo: 5, inProgress: 1, review: 0, done: 1 },
    activityLogs: [
      { id: "a1", user: "Birdie Erdman", timestamp: "Yesterday at 04:30 pm", action: "Updated", title: "Requested SSL security certificate update", badge: "Ticket: #102" },
    ],
  },
  {
    id: "28",
    title: "Virtual Reality Experience Design",
    projectType: "Internal Project",
    client: "-",
    price: "-",
    startDate: "12-08-2026",
    deadline: "19-08-2026",
    progress: 40,
    status: "Open",
    labels: ["On track"],
    totalHours: 24.0,
    members: [
      { id: "m3", name: "Michael Wood", role: "Project Manager" },
    ],
    taskBreakdown: { todo: 3, inProgress: 3, review: 2, done: 2 },
    activityLogs: [],
  },
  {
    id: "6",
    title: "Video Animation and Editing",
    projectType: "Client Project",
    client: "Kevin Johnston",
    price: "-",
    startDate: "17-08-2026",
    deadline: "08-09-2023",
    progress: 100,
    status: "Completed",
    labels: [],
    totalHours: 48.2,
    members: [
      { id: "m2", name: "Mark Thomas", role: "Animator" },
    ],
    taskBreakdown: { todo: 0, inProgress: 0, review: 0, done: 8 },
    activityLogs: [],
  },
  {
    id: "8",
    title: "UI/UX Design for Web App",
    projectType: "Client Project",
    client: "Howard Halvorson",
    price: "-",
    startDate: "10-07-2026",
    deadline: "20-09-2026",
    progress: 60,
    status: "Open",
    labels: ["On track"],
    totalHours: 32.0,
    members: [
      { id: "m1", name: "John Doe", role: "Admin" },
      { id: "m3", name: "Michael Wood", role: "Lead Designer" },
    ],
    taskBreakdown: { todo: 2, inProgress: 4, review: 1, done: 5 },
    activityLogs: [],
  },
  {
    id: "10",
    title: "Software Development for CRM",
    projectType: "Client Project",
    client: "Adrain Ondricka",
    price: "$1,000.00",
    startDate: "01-08-2026",
    deadline: "05-09-2026",
    progress: 100,
    status: "Completed",
    labels: [],
    totalHours: 120.0,
    members: [
      { id: "m1", name: "John Doe", role: "Admin" },
      { id: "m2", name: "Mark Thomas", role: "Fullstack Dev" },
    ],
    taskBreakdown: { todo: 0, inProgress: 0, review: 0, done: 14 },
    activityLogs: [],
  },
  {
    id: "3",
    title: "Social Media Marketing Campaign",
    projectType: "Client Project",
    client: "Fritsch, Okuneva and Armstrong",
    price: "-",
    startDate: "05-07-2026",
    deadline: "09-08-2026",
    progress: 100,
    status: "Completed",
    labels: [],
    totalHours: 54.0,
    members: [
      { id: "m3", name: "Michael Wood", role: "Marketing Lead" },
    ],
    taskBreakdown: { todo: 0, inProgress: 0, review: 0, done: 10 },
    activityLogs: [],
  },
  {
    id: "4",
    title: "Social Media Influencer Collaboration",
    projectType: "Client Project",
    client: "Acme Corp",
    price: "$5,000.00",
    startDate: "10-08-2026",
    deadline: "30-09-2026",
    progress: 75,
    status: "Open",
    labels: ["On track"],
    totalHours: 18.4,
    members: [
      { id: "m1", name: "John Doe", role: "Admin" },
    ],
    taskBreakdown: { todo: 1, inProgress: 3, review: 1, done: 5 },
    activityLogs: [],
  },
]

let projectsStore = [...initialProjects]

export const getProjects = async (): Promise<Project[]> => {
  return Promise.resolve([...projectsStore])
}

export const addProject = async (project: Omit<Project, "id">): Promise<Project> => {
  const newId = (Math.max(...projectsStore.map(p => parseInt(p.id) || 0), 0) + 1).toString()
  const newProject: Project = {
    ...project,
    id: newId,
    starred: false,
    totalHours: 0,
    members: [
      { id: "m1", name: "John Doe", role: "Admin", email: "john@saampark.com" }
    ],
    taskBreakdown: { todo: 0, inProgress: 0, review: 0, done: 0 },
    activityLogs: [
      { id: `act-${Date.now()}`, user: "John Doe", timestamp: "Just now", action: "Created", title: `Project "${project.title}" created`, badge: "Project" }
    ]
  }
  projectsStore = [newProject, ...projectsStore]
  return Promise.resolve(newProject)
}

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  projectsStore = projectsStore.map(p => p.id === id ? { ...p, ...updates } : p)
  const updated = projectsStore.find(p => p.id === id)!
  return Promise.resolve(updated)
}

export const deleteProject = async (id: string): Promise<boolean> => {
  projectsStore = projectsStore.filter(p => p.id !== id)
  return Promise.resolve(true)
}
