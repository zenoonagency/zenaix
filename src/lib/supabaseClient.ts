import { createClient } from "@supabase/supabase-js";
import { API_CONFIG } from "../config/api.config";

export const supabase = createClient(
  API_CONFIG.supabaseUrl,
  API_CONFIG.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      retryAfterMs: (tries) => Math.min(tries * 1000, 10000),
      maxRetries: 5,
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js/2.38.0',
      },
    },
  }
);
