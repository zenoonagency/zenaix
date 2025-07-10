export const API_CONFIG = {
  baseUrl: 'https://app-backend-zenaix.mgmxhs.easypanel.host/api',
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