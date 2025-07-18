export const API_CONFIG = {
  baseUrl: "/api",
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
  invites: {
    send: (organizationId: string) =>
      `/organizations/${organizationId}/invites`,
    accept: "/invitations/accept",
    findAll: (organizationId: string) =>
      `/organizations/${organizationId}/invites`,
    findById: (organizationId: string, invitationId: string) =>
      `/organizations/${organizationId}/invites/invitationId/${invitationId}`,
    revoke: (organizationId: string, invitationId: string) =>
      `/organizations/${organizationId}/invites/${invitationId}/revoke`,
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
  embed: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/embeds/`,
    findAll: (organizationId: string) =>
      `/organizations/${organizationId}/embeds/`,
    findById: (organizationId: string, embedId: string) =>
      `/organizations/${organizationId}/embeds/`,
    update: (organizationId: string, embedId: string) =>
      `/organizations/${organizationId}/embeds/${embedId}`,
    delete: (organizationId: string, embedId: string) =>
      `/organizations/${organizationId}/embeds/${embedId}`,
  },
  tags: {
    create: (organizationId: string) => `/organizations/${organizationId}/tags`,
    findAll: (organizationId: string) =>
      `/organizations/${organizationId}/tags`,
    findById: (organizationId: string, tagId: string) =>
      `/organizations/${organizationId}/tags/${tagId}`,
    update: (organizationId: string, tagId: string) =>
      `/organizations/${organizationId}/tags/${tagId}`,
    delete: (organizationId: string, tagId: string) =>
      `/organizations/${organizationId}/tags/${tagId}`,
  },
  whatsapp: {
    getAllMessages: "/todas_messages",
    getMessages: "/messages",
  },
  contracts: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/contracts`,
    findAll: (organizationId: string) =>
      `/organizations/${organizationId}/contracts`,
    findById: (organizationId: string, contractId: string) =>
      `/organizations/${organizationId}/contracts/${contractId}`,
    update: (organizationId: string, contractId: string) =>
      `/organizations/${organizationId}/contracts/${contractId}`,
    delete: (organizationId: string, contractId: string) =>
      `/organizations/${organizationId}/contracts/${contractId}`,
    uploadFile: (organizationId: string, contractId: string) =>
      `/organizations/${organizationId}/contracts/${contractId}/file`,
    downloadFile: (organizationId: string, contractId: string) =>
      `/organizations/${organizationId}/contracts/${contractId}/file`,
    deleteFile: (organizationId: string, contractId: string) =>
      `/organizations/${organizationId}/contracts/${contractId}/file`,
  },
  finance: {
    create: (organizationId: string) =>
      `/organizations/${organizationId}/transactions`,
    findAll: (organizationId: string) =>
      `/organizations/${organizationId}/transactions`,
    findById: (organizationId: string, transactionId: string) =>
      `/organizations/${organizationId}/transactions/${transactionId}`,
    getSummary: (organizationId: string) =>
      `/organizations/${organizationId}/transactions/summary`,
    update: (organizationId: string, transactionId: string) =>
      `/organizations/${organizationId}/transactions/${transactionId}`,
    delete: (organizationId: string, transactionId: string) =>
      `/organizations/${organizationId}/transactions/${transactionId}`,
    deleteAll: (organizationId: string) =>
      `/organizations/${organizationId}/transactions/transactions`,
  },
  permissions: {
    listAll: "/permissions",
  },
  teamMembers: {
    findAll: (organizationId: string) =>
      `/organizations/${organizationId}/members`,
    findById: (organizationId: string, memberId: string) =>
      `/organizations/${organizationId}/members/${memberId}`,
    updateRole: (organizationId: string, memberId: string) =>
      `/organizations/${organizationId}/members/${memberId}/role`,
    remove: (organizationId: string, memberId: string) =>
      `/organizations/${organizationId}/members/${memberId}`,
    permissions: {
      list: (organizationId: string, memberId: string) =>
        `/organizations/${organizationId}/members/${memberId}/permissions`,
      grant: (organizationId: string, memberId: string) =>
        `/organizations/${organizationId}/members/${memberId}/permissions`,
      revoke: (organizationId: string, memberId: string) =>
        `/organizations/${organizationId}/members/${memberId}/permissions`,
    },
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
