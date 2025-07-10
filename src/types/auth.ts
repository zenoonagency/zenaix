export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  organizationId?: string | null;
  language: string
  timezone: string
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  plan?: string;
  phoneNumber?: string;
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

export interface AuthResponse {
  message: string;
  data: User;
  token: string;
  status: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
} 