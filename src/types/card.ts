export type CardPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface InputCreateCardDTO {
  title: string;
  description?: string;
  value?: number;
  phone?: string;
  due_date?: string;
  priority?: CardPriority;
  assignee_id?: string;
  tag_ids?: string[];
  subtasks?: Array<{ title: string }>;
}

export interface InputUpdateCardDTO {
  title?: string;
  description?: string;
  value?: number;
  phone?: string;
  due_date?: string;
  priority?: CardPriority;
  assignee_id?: string;
  tag_ids?: string[];
  subtasks?: Array<{
    id?: string;
    title: string;
    description?: string;
    is_completed?: boolean;
  }>;
  list_id?: string;
  position?: number;
}

export interface OutputCardDTO {
  id: string;
  title: string;
  description?: string;
  value?: number;
  phone?: string;
  due_date?: string;
  priority?: CardPriority;
  position: number;
  list_id: string;
  assignee_id?: string | null;
  assignee?: any;
  tag_ids?: string[];
  tags?: Array<{
    id: string;
    name: string;
    color: string;
    organization_id: string;
  }>;
  subtasks?: Array<{
    id: string;
    title: string;
    description?: string | null;
    is_completed: boolean;
    card_id: string;
  }>;
  attachments?: Array<any>;
  created_at: string;
  updated_at: string;
  list?: any;
}

export interface CardResponse {
  message: string;
  data: OutputCardDTO;
  status: number;
}

export interface CardListResponse {
  message: string;
  data: OutputCardDTO[];
  status: number;
}
