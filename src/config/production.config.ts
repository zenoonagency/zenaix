export const PRODUCTION_CONFIG = {
  api: {
    baseUrl:
      import.meta.env.VITE_API_BASE_URL ||
      "https://codigo-zenaix-backend.w9rr1k.easypanel.host",
    supabaseUrl:
      import.meta.env.VITE_SUPABASE_URL ||
      "https://samiqqeumkhpfgwdkjvb.supabase.co",
    supabaseAnonKey:
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWlxcWV1bWtocGZnd2RranZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTM3NTYsImV4cCI6MjA2NzM4OTc1Nn0.tKy_PaZetxDfHqLH626SWPk6fWu8HQvhZCQG-4zXbUM",
  },
  webhook: {
    baseUrl:
      import.meta.env.VITE_WEBHOOK_BASE_URL ||
      "https://zenoon-agency-n8n.htm57w.easypanel.host/webhook",
  },
  websocket: {
    url:
      import.meta.env.VITE_WS_URL ||
      "wss://zenoon-agency-n8n.htm57w.easypanel.host/ws",
  },
  environment: "production",
};
