export const API_CONFIG = {
  baseUrl: 'https://zenoon-agency-n8n.htm57w.easypanel.host/webhook',
  endpoints: {
    startAI: '/liga',
    stopAI: '/desliga',
    uploadDocument: '/arquivo'
  },
  timeouts: {
    default: 30000,
    upload: 60000
  },
  retries: {
    count: 2,
    delay: 1000
  }
};