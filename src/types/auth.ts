import { RealtimeChannel } from "@supabase/supabase-js";
import { OrganizationOutput } from "./organization";

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  organizationId?: string | null;
  organization?: OrganizationOutput | null;
  language: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  plan?: string;
  phoneNumber?: string;
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
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  organization: OrganizationOutput | null;
  permissions: string[];
  _hasHydrated: boolean;
  realtimeChannel: RealtimeChannel | null;
  isSyncingUser: boolean;

  connectToRealtime: () => void;
  disconnectFromRealtime: () => void;
  hasPermission: (permission: string) => boolean;
  login: (payload: AuthSuccessPayload) => void;
  logout: () => void;
  setToken: (token: string) => void;
  updateUser: (user: Partial<User>) => void;
  setOrganization: (organization: OrganizationOutput) => void;
  fetchAndSyncUser: () => Promise<void>;
}
