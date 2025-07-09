export interface Contact {
  id: string;
  name: string;
  phone: string;
  tagIds?: string[];
}

export type MessageType = 'text' | 'image' | 'video' | 'audio';

export interface MessageContent {
  type: MessageType;
  content: string; // Text content or file URL
  filename?: string; // For media files
}

export interface MessageBatch {
  id: string;
  context: string;
  messages: MessageContent[];
  contacts: Contact[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface MessagingState {
  batches: MessageBatch[];
  selectedContacts: string[];
  addBatch: (id: string, context: string, messages: MessageContent[], contacts: Contact[]) => void;
  updateBatchProgress: (id: string, progress: number, status: MessageBatch['status'], sentCount?: number, failedCount?: number) => void;
  completeBatch: (id: string, sentCount: number, failedCount: number) => void;
  removeBatch: (id: string) => void;
  clearAllBatches: () => void;
  cleanupOldBatches: () => void;
  setSelectedContacts: (contactIds: string[]) => void;
  clearSelectedContacts: () => void;
}