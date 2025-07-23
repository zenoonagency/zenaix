export type CardPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Tipos para Anexos
export interface AttachmentDTO {
  id: string;
  file_name: string;
  file_url: string;
  fileType: string;
  fileSize: number;
  card_id: string;
  created_at: string;
}

export interface AttachmentResponse {
  message: string;
  data: AttachmentDTO[];
  status: number;
}

export interface AttachmentDownloadResponse {
  message: string;
  data: {
    url: string;
  };
  status: number;
}

// Tipos para Subtarefas
export interface InputCreateSubtaskDTO {
  title: string;
  description?: string;
}

export interface InputUpdateSubtaskDTO {
  title?: string;
  description?: string;
  is_completed?: boolean;
}

export interface SubtaskDTO {
  id: string;
  title: string;
  description?: string | null;
  is_completed: boolean;
  card_id: string;
}

export interface SubtaskResponse {
  message: string;
  data: SubtaskDTO[];
  status: number;
}

export interface SubtaskSingleResponse {
  message: string;
  data: SubtaskDTO;
  status: number;
}

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
  attachments?: Array<any>;
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
  attachments?: Array<any>;
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
  attachments?: Array<AttachmentDTO>;
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

export interface CardState {
  cards: OutputCardDTO[];
  isLoading: boolean;
  error: string | null;
  selectedCard: OutputCardDTO | null;
  lastFetched: number | null;

  setCards: (cards: OutputCardDTO[]) => void;
  addCard: (card: OutputCardDTO) => void;
  updateCard: (card: OutputCardDTO) => void;
  removeCard: (cardId: string) => void;
  setSelectedCard: (card: OutputCardDTO | null) => void;

  fetchAllCards: (
    boardId: string,
    listId: string,
    title?: string
  ) => Promise<void>;
  cleanUserData: () => void;
}
