export const API_CONFIG = {
  baseUrl: "https://app-backend-zenaix.mgmxhs.easypanel.host/api",
  supabaseUrl: "https://samiqqeumkhpfgwdkjvb.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWlxcWV1bWtocGZnd2RranZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTM3NTYsImV4cCI6MjA2NzM4OTc1Nn0.tKy_PaZetxDfHqLH626SWPk6fWu8HQvhZCQG-4zXbUM",
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
  subscriptions: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/subscriptions/`,
    manage: (organizationId: string) =>
      `/organizations/${organizationId}/subscriptions/manage`,
    cancel: (organizationId: string) =>
      `/organizations/${organizationId}/subscriptions/`,

    reactivate: (organizationId: string) =>
      `/organizations/${organizationId}/subscriptions/reactivate`,
    changePlan: (organizationId: string) =>
      `/organizations/${organizationId}/subscriptions/change-plan`,
    addSlots: (organizationId: string) =>
      `/organizations/${organizationId}/subscriptions/add-slots`,
    removeSlots: (organizationId: string) =>
      `/organizations/${organizationId}/subscriptions/remove-slots`,
    purchaseOneTime: (organizationId: string) =>
      `/organizations/${organizationId}/subscriptions/purchase-one-time-triggers`,
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
