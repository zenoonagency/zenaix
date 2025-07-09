// src/pages/Clients/types.ts
export type Priority = 'low' | 'medium' | 'high';

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

export type CustomFieldType = 'text' | 'number' | 'date' | 'boolean' | 'file' | 'email' | 'tel' | 'select';

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

export interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  tags: string[];
  tagIds?: string[];
  assignedTo?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed';
  value?: number;
  responsibleId?: string;
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  email?: string;
  phone?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  title: string;
  cards: Card[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardConfig {
  visibility: 'all' | 'creator' | 'selected';
  allowedUsers: string[];
}

export interface Board {
  id: string;
  title: string;
  lists: List[];
  hidden: boolean;
  completedListId?: string;
  createdAt: string;
  updatedAt: string;
  config?: BoardConfig;
}

export interface KanbanState {
  boards: Board[];
  activeBoard: string | null;
  setActiveBoard: (boardId: string | null) => void;
  addBoard: (title: string) => void;
  updateBoard: (id: string, title: string) => void;
  deleteBoard: (id: string) => void;
  duplicateBoard: (id: string) => void;
  toggleBoardVisibility: (id: string) => void;
  addList: (boardId: string, list: Omit<List, 'id'>) => void;
  updateList: (boardId: string, listId: string, updates: Partial<List>) => void;
  deleteList: (boardId: string, listId: string) => void;
  duplicateList: (boardId: string, listId: string) => void;
  addCard: (boardId: string, listId: string, card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCard: (boardId: string, listId: string, cardId: string, updates: Partial<Card>) => void;
  deleteCard: (boardId: string, listId: string, cardId: string) => void;
  duplicateCard: (boardId: string, listId: string, cardId: string) => void;
  moveCard: (boardId: string, fromListId: string, toListId: string, cardId: string) => void;
  cleanupStorage: () => void;
}

export type TriggerType = 
  | 'card_moved' 
  | 'card_created' 
  | 'card_updated' 
  | 'card_tagged' 
  | 'card_due_date' 
  | 'card_assigned';

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
