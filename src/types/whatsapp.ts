// Types para o novo módulo de WhatsApp (contatos e mensagens via API REST)

// ========== CONTATOS ========== //

export interface WhatsappContact {
  id: string;
  name: string;
  phone: string;
  avatar_url?: string | null;
  whatsapp_instance_id: string;
  created_at: string;
  updated_at: string;
}

export interface InputCreateWhatsappContactDTO {
  name: string;
  phone: string;
}

export interface InputUpdateWhatsappContactDTO {
  name?: string;
  phone?: string;
}

export interface WhatsappContactResponse {
  message: string;
  data: WhatsappContact;
  status: number;
}

export interface WhatsappContactListResponse {
  message: string;
  data: WhatsappContact[];
  status: number;
}

// ========== MENSAGENS ========== //

export type WhatsappMessageDirection = 'INCOMING' | 'OUTGOING';

export interface WhatsappMessage {
  id: string;
  body: string | null;
  direction: WhatsappMessageDirection;
  timestamp: string; // ISO
  media_url: string | null;
  media_type: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  media_duration_sec: number | null;
}

export interface InputSendMessageDTO {
  phone: string;
  message: string;
}

export interface WhatsappMessageListResponse {
  message: string;
  data: WhatsappMessage[];
  status: number;
}

// ========== STATE TYPES PARA STORE ========== //

export interface WhatsappContactState {
  contacts: WhatsappContact[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export interface WhatsappMessageState {
  messages: WhatsappMessage[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
} 