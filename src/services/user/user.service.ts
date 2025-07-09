import { RegisterData, User } from '../../types/auth';
import { API_CONFIG } from '../config/api.config';
import { APIError } from '../errors/api.errors';

export const userService = {
  async register(data: RegisterData): Promise<{ user: User; message: string }> {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.register}`, {
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
        throw new APIError('Falha ao registrar usuário. Por favor, tente novamente.');
      }

      const responseData = await response.json();

      return {
        user: {
          id: responseData.userId || '1',
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