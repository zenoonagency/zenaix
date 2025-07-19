export interface CalendarEvent {
  start: string | number | Date;
  end: string | number | Date;
  responsible: any;
  id: string;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  color: string;
  organization_id: string;
  creator_id: string;
  assignee_id?: string;
  creator: CalendarUser;
  assignee?: CalendarUser;
  categories: CalendarCategory[];
  notifications: CalendarNotification[];
  created_at?: string;
  updated_at?: string;
}

export interface CalendarUser {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  role: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
}

export interface CalendarNotification {
  id: string;
  sendAt: string;
  status: "PENDING" | "SENT" | "FAILED";
  attempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  recipient_id: string;
  event_id: string;
  contract_id?: string;
}

export interface InputCreateEventDTO {
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  color: string;
  notification: "NONE" | "MINUTES_15" | "HOUR_1" | "DAY_1";
  assignee_id?: string;
  categories?: {
    name: string;
    color: string;
  }[];
}

export interface InputUpdateEventDTO {
  title?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  color?: string;
  notification?: "NONE" | "MINUTES_15" | "HOUR_1" | "DAY_1";
  assignee_id?: string;
  categories?: {
    name: string;
    color: string;
  }[];
}

export interface CalendarFilters {
  year?: number;
  month?: number;
  searchTerm?: string;
  start_date?: string;
  end_date?: string;
}

export interface CalendarResponse {
  message: string;
  data: CalendarEvent;
  status: number;
}

export interface CalendarListResponse {
  message: string;
  data: CalendarEvent[];
  status: number;
}
