export const API_CONFIG = {
  baseUrl: "https://app-backend-zenaix.mgmxhs.easypanel.host/api",
  endpoints: {
    startAI: "/liga",
    stopAI: "/desliga",
    uploadDocument: "/arquivo",
    register: "/register",
  },
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    profile: "/auth/profile",
  },
  users: {
    me: "/users/me",
    me_avatar: "/users/me/avatar",
    update: (userId: string) => `/users/${userId}`,
  },
  plans: {
    create: "/plans/",
    readAll: "/plans/",
    readById: (id: string) => `/plans/${id}`,
    update: (id: string) => `/plans/${id}`,
    delete: (id: string) => `/plans/${id}`,
  },
  organizations: {
    create: "/organizations/",
    readAll: "/organizations/",
    readById: (organizationId: string) => `/organizations/${organizationId}`,
    update: (organizationId: string) => `/organizations/${organizationId}`,
    delete: (organizationId: string) => `/organizations/${organizationId}`,
  },
  whatsapp: {
    getAllMessages: "/todas_messages",
    getMessages: "/messages",
  },
  timeouts: {
    default: 30000,
    upload: 60000,
  },
  retries: {
    count: 2,
    delay: 1000,
  },
};
