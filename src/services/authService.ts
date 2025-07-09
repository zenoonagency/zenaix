import { LoginData, RegisterData, AuthResponse } from '../types/auth';
import { API_CONFIG } from '../config/api.config';

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    try {      
      const response = await fetch(`${API_CONFIG.authBaseUrl}${API_CONFIG.auth.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        throw new Error(errorData.message || 'Erro ao fazer login');
      }

      const responseData = await response.json();
      
      localStorage.setItem('auth_token', responseData.token);
      
      return responseData;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao fazer login');
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      
      let requestBody: FormData | string;
      let headers: Record<string, string>;

      if (data.avatar) {
        // Se tem avatar, usar FormData
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('password', data.password);
        if (data.language) formData.append('language', data.language);
        if (data.timezone) formData.append('timezone', data.timezone);
        formData.append('avatar', data.avatar);
        
        requestBody = formData;
        headers = {}; // Não definir Content-Type, deixar o browser definir
      } else {
        // Se não tem avatar, usar JSON
        requestBody = JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          language: data.language || 'pt-BR',
          timezone: data.timezone || 'America/Sao_Paulo'
        });
        headers = {
          'Content-Type': 'application/json',
        };
      }

      const response = await fetch(`${API_CONFIG.authBaseUrl}${API_CONFIG.auth.register}`, {
        method: 'POST',
        headers,
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        throw new Error(errorData.message || 'Erro ao registrar usuário');
      }

      const responseData = await response.json();
      
      // Salvar token no localStorage
      localStorage.setItem('auth_token', responseData.token);
      
      return responseData;
    } catch (error) {
      console.error('Register error:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao registrar usuário');
    }
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    // Limpar dados do Zustand também
    localStorage.removeItem('auth-status');
  },

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  },

  // Função para limpar dados corrompidos
  clearCorruptedData(): void {
    this.logout();
  },

  // Função para verificar integridade dos dados
  validateAuthData(): boolean {
    const token = this.getStoredToken();
    const authData = localStorage.getItem('auth-status');
    
    if (!token) {
      this.clearCorruptedData();
      return false;
    }

    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.state?.isAuthenticated && (!parsed.state?.user || !parsed.state?.token)) {
          this.clearCorruptedData();
          return false;
        }
      } catch (error) {
        this.clearCorruptedData();
        return false;
      }
    }

    return true;
  }
}; 