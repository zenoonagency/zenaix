import { RealtimeChannel } from "@supabase/supabase-js";
import { OrganizationOutput } from "./organization";

export interface User {
  id: string;
  email: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  organization_id?: string | null;
  organization?: OrganizationOutput | null;
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  plan?: string;
  phone_number?: string;
  permissions: string[];
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  language?: string;
  timezone?: string;
  avatar?: File;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthSuccessPayload {
  user: User;
  organization: OrganizationOutput | null;
  permissions: string[];
  token: string;
  refreshToken: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  organization: OrganizationOutput | null;
  permissions: string[];
  _hasHydrated: boolean;
  isSyncingUser: boolean;

  setToken: (token: string) => void;
  setSession: (accessToken: string, refreshToken: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  login: (payload: AuthSuccessPayload) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setOrganization: (organization: OrganizationOutput) => void;
  fetchAndSyncUser: () => Promise<User | null>;
}
