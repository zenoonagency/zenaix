import { createClient } from "@supabase/supabase-js";
import { API_CONFIG } from "../config/api.config";

export const supabase = createClient(
  API_CONFIG.supabaseUrl,
  API_CONFIG.supabaseAnonKey, {
     auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  }
);
