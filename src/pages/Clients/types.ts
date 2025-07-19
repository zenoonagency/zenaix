// src/pages/Clients/types.ts
export type Priority = "low" | "medium" | "high";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export type CustomFieldType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "file"
  | "email"
  | "tel"
  | "select";

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  value: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

export type TriggerType =
  | "card_moved"
  | "card_created"
  | "card_updated"
  | "card_tagged"
  | "card_due_date"
  | "card_assigned";

export interface Automation {
  id: string;
  name: string;
  triggerType: TriggerType;
  sourceListId?: string;
  targetListId?: string;
  webhookUrl: string;
  active: boolean;
  tagName?: string;
  daysBeforeDue?: number;
  assignedUserId?: string;
  fieldName?: string;
  createdAt: string;
  updatedAt: string;
}
