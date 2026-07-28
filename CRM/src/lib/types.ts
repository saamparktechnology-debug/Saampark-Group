export type LeadStatus = "New" | "Negotiation" | "Discussion" | "Qualified" | "Won" | "Lost";

export type Lead = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  owner: string;
  createdAt: string;
  deadline?: string;
  status: LeadStatus;
  label: string;
  type?: "organization" | "person";
  email?: string;
  managers?: string;
  source?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  amount?: number;
  contactsList?: Array<{
    id: string;
    name: string;
    designation: string;
    email: string;
    phone: string;
  }>;
  eventsList?: Array<{
    id: string;
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
  }>;
  tasksList?: Array<{
    id: string;
    title: string;
    done: boolean;
  }>;
  notesList?: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  remindersList?: Array<{
    id: string;
    content: string;
    time: string;
  }>;
  estimatesList?: Array<{
    id: string;
    estimateNumber: string;
    status: "Draft" | "Sent" | "Accepted" | "Declined";
    date: string;
    validUntil: string;
    items: Array<{
      id: string;
      item: string;
      description: string;
      quantity: string;
      rate: number;
      total: number;
    }>;
    discount: number;
    tax: number;
  }>;
  proposalsList?: Array<{
    id: string;
    proposalNumber: string;
    status: "Draft" | "Sent" | "Accepted" | "Declined";
    date: string;
    validUntil: string;
    items: Array<{
      id: string;
      item: string;
      description: string;
      quantity: string;
      rate: number;
      total: number;
    }>;
    discount: number;
    tax: number;
  }>;
  contractsList?: Array<{
    id: string;
    contractNumber: string;
    status: "Draft" | "Sent" | "Accepted" | "Declined";
    date: string;
    validUntil: string;
    items: Array<{
      id: string;
      item: string;
      description: string;
      quantity: string;
      rate: number;
      total: number;
    }>;
    discount: number;
    tax: number;
  }>;
};

export type DashboardGraphType = "donut" | "bar" | "area";

export type DashboardConfig = {
  id: string;
  label: string;
  openTasks: number;
  events: number;
  due: string;
  graphType: DashboardGraphType;
  ticketColor: string;
};

export type Project = {
  id: string;
  title: string;
  client: string;
  price: string;
  startDate: string;
  deadline: string;
  progress: number;
  status: "Open" | "Completed";
  tag?: { label: string; className: string };
};

export type TaskStatus = "To do" | "In progress" | "Review" | "Done";

export type Task = {
  id: number;
  title: string;
  description?: string;
  relatedTo?: string;
  points?: string;
  assignedTo?: string;
  collaborators?: string;
  status: TaskStatus;
  priority?: "Low" | "Medium" | "High";
  labels?: string;
  startDate?: string;
  deadline?: string;
  recurring?: boolean;
  avatar?: string;
  checklist?: Array<{ id: string; text: string; done: boolean }>;
  subTasks?: Array<{ id: string; title: string; done: boolean }>;
  comments?: Array<{ id: string; content: string; author: string; createdAt: string; avatar: string }>;
  timeLogged?: number; // total seconds logged
};

export type AppDb = {
  leads: Lead[];
  dashboards: DashboardConfig[];
  projects: Project[];
  tasks?: Task[];
  tickets?: Ticket[];
  ticketTemplates?: TicketTemplate[];
};

export type TicketStatus = "New" | "Open" | "Closed";

export type TicketComment = {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  avatar: string;
  type?: "message" | "note";
};

export type Ticket = {
  id: number;
  title: string;
  client: string;
  requestedBy?: string;
  ticketType: string;
  labels?: string;
  assignedTo?: string;
  lastActivity: string;
  status: TicketStatus;
  description?: string;
  files?: string[];
  comments?: TicketComment[];
  tasksList?: Array<{ id: string; title: string; done: boolean }>;
  remindersList?: Array<{ id: string; content: string; time: string }>;
};

export type TicketTemplate = {
  id: number;
  title: string;
  description: string;
  ticketType: string;
  private: boolean;
};

