// Tipos para Instância WhatsApp
export type WhatsAppInstanceStatus = "CONNECTED" | "DISCONNECTED";
export type WhatsAppInstanceAccessLevel = "CREATOR_ONLY" | "SELECTED_MEMBERS" | "TEAM_WIDE"; 


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
  last_activity: string;
  accesses?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
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

  setInstances: (instances: WhatsAppInstanceOutput[]) => void;
  addInstance: (instance: WhatsAppInstanceOutput) => void;
  updateInstance: (instance: WhatsAppInstanceOutput) => void;
  deleteInstance: (instanceId: string) => void;
  fetchAllInstances: (token: string, organizationId: string) => Promise<void>;
  cleanUserData: () => void;
} 