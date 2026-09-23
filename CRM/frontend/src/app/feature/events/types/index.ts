export type CalendarViewMode = "month" | "week" | "day" | "list";

export type EventTypeOption = 
  | "Events" 
  | "Leave" 
  | "Task start date" 
  | "Task deadline" 
  | "Project start date" 
  | "Project deadline";

export interface EventLabel {
  id: string;
  name: string;
  color: string; // HEX or CSS color
}

export type EventAudience = "only_me" | "only_clients" | "only_teams" | "all";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime?: string; // HH:mm
  location?: string;
  label?: string;
  labelColor?: string;
  eventType: EventTypeOption;
  client?: string;
  isPublicHoliday?: boolean;
  shareWith?: "Only me" | "All team members" | "Specific members and teams";
  audience?: EventAudience;
  isRepeat?: boolean;
  color: string;
  isLocked?: boolean;
  createdBy?: string;
  creatorEmail?: string;
  creatorRole?: string;
  companyId?: string;
  branchId?: string;
  createdAt?: string;
}
