export const API_CONFIG = {
  baseUrl: 'https://zenoon-agency-n8n.htm57w.easypanel.host/webhook',
  authBaseUrl: 'https://app-backend-zenaix.mgmxhs.easypanel.host/api',
  endpoints: {
    startAI: '/liga',
    stopAI: '/desliga',
    uploadDocument: '/arquivo',
    register: '/register'
  },
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    profile: '/auth/profile',
  },
  whatsapp: {
    getAllMessages: '/todas_messages',
    getMessages: '/messages'
  }
}; 