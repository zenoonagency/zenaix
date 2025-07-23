export type MessageType = "text" | "image" | "video" | "audio" | "document";

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
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  completedAt?: string;
}
