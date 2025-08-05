// Tipos para Instância WhatsApp
export type WhatsAppInstanceStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "QR_PENDING";
export type WhatsAppInstanceAccessLevel =
  | "CREATOR_ONLY"
  | "SELECTED_MEMBERS"
  | "TEAM_WIDE";

export interface WhatsAppInstanceOutput {
  id: string;
  name: string;
  phone_number: string | null;
  qr_code: string | null;
  status: WhatsAppInstanceStatus;
  access_level: WhatsAppInstanceAccessLevel;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_activity: string | null;
  accesses?: Array<{
    user_id: string;
    user: {
      id: string;
      email: string;
      name: string;
      first_name: string | null;
      last_name: string | null;
      role: string;
      organization_id: string;
      created_at: string;
      updated_at: string;
      language: string;
      timezone: string;
      avatar_url: string | null;
      organization: any;
      organization_mastered: any;
    };
  }>;
  member_ids?: string[];
}

export interface InputCreateWhatsAppInstanceDTO {
  name: string;
  access_level: WhatsAppInstanceAccessLevel;
  member_ids: string[];
}

export interface InputUpdateWhatsAppInstanceDTO {
  name?: string;
  access_level?: WhatsAppInstanceAccessLevel;
  member_ids?: string[];
}

export interface WhatsAppInstanceState {
  instances: WhatsAppInstanceOutput[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastActiveInstanceId: string | null;

  setInstances: (instances: WhatsAppInstanceOutput[]) => void;
  addInstance: (instance: WhatsAppInstanceOutput) => void;
  updateInstance: (instance: WhatsAppInstanceOutput) => void;
  deleteInstance: (instanceId: string) => void;
  updateQrCode: (instanceId: string, qrCode: string) => void;
  fetchAllInstances: (token: string, organizationId: string) => Promise<void>;
  setLastActiveInstance: (instanceId: string) => void;

  cleanUserData: () => void;
}
