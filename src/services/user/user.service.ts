import { RegisterData, User } from '../../types/auth';
import { APIError } from '../errors/api.errors';
import { API_CONFIG } from '../../config/api.config';

export const userService = {
  async register(data: RegisterData): Promise<{ user: User; message: string }> {
    try {
      const response = await fetch(`${API_CONFIG.authBaseUrl}${API_CONFIG.auth.register}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(errorData.message || 'Falha ao registrar usuário. Por favor, tente novamente.');
      }

      const responseData = await response.json();

      return {
        user: {
          id: responseData.userId || responseData.user?.id || '1',
          name: data.name,
          email: data.email,
        },
        message: responseData.message || 'Registro realizado com sucesso!'
      };
    } catch (error) {
      console.error('Register Error:', error);
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Falha ao registrar usuário. Por favor, tente novamente.');
    }
  },
};