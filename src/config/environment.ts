import { PRODUCTION_CONFIG } from "./production.config";

const isProduction =
  import.meta.env.PROD || import.meta.env.MODE === "production";

export const ENV_CONFIG = {
  isProduction,
  api: {
    baseUrl: isProduction ? PRODUCTION_CONFIG.api.baseUrl : "/api",
    supabaseUrl: PRODUCTION_CONFIG.api.supabaseUrl,
    supabaseAnonKey: PRODUCTION_CONFIG.api.supabaseAnonKey,
  },
  webhook: {
    baseUrl: isProduction ? PRODUCTION_CONFIG.webhook.baseUrl : "/webhook",
  },
  websocket: {
    url: PRODUCTION_CONFIG.websocket.url,
  },
  environment: isProduction ? "production" : "development",
};
