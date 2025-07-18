import { API_CONFIG } from "./api.config";

export const ENDPOINTS = {
  SETTINGS: {
    ASAAS: "https://fluxos-n8n.mgmxhs.easypanel.host/webhook/asaas",
  },
  AI_SERVICE: {
    LIGA: `${API_CONFIG.baseUrl}/liga`,
    DESLIGA: `${API_CONFIG.baseUrl}/desliga`,
  },
  API_EVOLUTION: {
    WHATSAPP_QR_CODE: `${this.baseUrl}/whatsapp/qr-code`,
    WHATSAPP_STATUS: `${this.baseUrl}/whatsapp/status`,
    WHATSAPP_SEND: `${this.baseUrl}/whatsapp/send`,
    CONVERSATION_CONTROL: `${this.baseUrl}/conversation/control`,
  },
  PROFILE: {
    AGENT_WEBHOOK: "webhookAgent", // Variable, not a fixed URL
  },
  MESSAGING: {
    DISPARO_WEBHOOK: "DISPARO_WEBHOOK", // Variable, not a fixed URL
  },
  CONVERSATIONS: {
    GET_QR_CODE:
      "https://zenoon-agency-n8n.htm57w.easypanel.host/webhook-test/getqrcode",
    STATUS:
      "https://zenoon-agency-n8n.htm57w.easypanel.host/webhook-test/status",
  },
  GOOGLE_CALENDAR: {
    USER_INFO: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  PROFILE_MODAL: {
    CHECK_CONNECTING:
      "https://fluxos-n8n.mgmxhs.easypanel.host/webhook/check_connecting",
    CHECK_EXISTING:
      "https://fluxos-n8n.mgmxhs.easypanel.host/webhook/check-existing",
    QRCODE: "https://fluxos-n8n.mgmxhs.easypanel.host/webhook/qrcode",
    CREATE_QR_CODE:
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://wa.me/",
  },
  HEADER: {
    CHAT: "https://zenoon-agency-n8n.htm57w.easypanel.host/webhook/c0bf5d3e-e3a4-4d66-aec6-6edcc9c6a666/chat",
  },
  TEAM_MEMBERS: {
    FIND_ALL: (orgId: string) => `/organizations/${orgId}/members`,
    FIND_BY_ID: (orgId: string, memberId: string) =>
      `/organizations/${orgId}/members/${memberId}`,
    UPDATE_ROLE: (orgId: string, memberId: string) =>
      `/organizations/${orgId}/members/${memberId}/role`,
    REMOVE: (orgId: string, memberId: string) =>
      `/organizations/${orgId}/members/${memberId}`,
  },
};
