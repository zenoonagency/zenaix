export const API_CONFIG = {
  baseUrl: 'https://zenoon-agency-n8n.htm57w.easypanel.host/webhook',
  endpoints: {
    startAI: '/liga',
    stopAI: '/desliga',
    uploadDocument: '/arquivo',
  },
  headers: {
    json: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    formData: {
      'Accept': 'application/json',
    },
  },
  requestTimeout: 30000, // 30 seconds
};