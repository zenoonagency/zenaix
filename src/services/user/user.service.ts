import { RegisterData, User } from '../../types/auth';
import { APIError } from '../errors/api.errors';
import { API_CONFIG } from '../../config/api.config';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';


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
          role: 'user',
          language: data.language,
          timezone: data.timezone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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

  async updateUser(userId: string, updates: { name?: string; language?: string; timezone?: string }): Promise<User> {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      if (!token) {
        throw new APIError('Token de autenticação não encontrado');
      }



      const response = await fetch(`${API_CONFIG.authBaseUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        console.error('Erro na resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        const errorData = await response.json().catch(() => ({}));
        console.error('Dados do erro:', errorData);
        
        throw new APIError(errorData.message || `Falha ao atualizar usuário. Status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Garantir que a resposta tenha a estrutura correta
      if (responseData.user) {
        return responseData.user;
      } else if (responseData.data) {
        return responseData.data;
      } else {
        return responseData;
      }
    } catch (error) {
      console.error('Update User Error:', error);
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Falha ao atualizar usuário. Por favor, tente novamente.');
    }
  },

  async updateAvatar(avatarFile: File): Promise<User> {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      if (!token) {
        throw new APIError('Token de autenticação não encontrado');
      }



      const formData = new FormData();
      formData.append('avatar', avatarFile);

      // Usar o endpoint correto /users/me/avatar
      const response = await fetch(`${API_CONFIG.authBaseUrl}/users/me/avatar`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error('Erro na resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        const errorData = await response.json().catch(() => ({}));
        console.error('Dados do erro:', errorData);
        
        throw new APIError(errorData.message || `Falha ao atualizar avatar. Status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Retornar os dados do usuário da resposta
      return responseData.data;
    } catch (error) {
      console.error('Update Avatar Error:', error);
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Falha ao atualizar avatar. Por favor, tente novamente.');
    }
  },

  async removeAvatar(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      if (!token) {
        throw new APIError('Token de autenticação não encontrado');
      }

      const response = await fetch(`${API_CONFIG.authBaseUrl}/users/me/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(errorData.message || 'Falha ao remover avatar. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Remove Avatar Error:', error);
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Falha ao remover avatar. Por favor, tente novamente.');
    }
  },

  async deleteAccount(password: string): Promise<void> {
   try {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) throw new Error('Token não encontrado');

    const response = await fetch(`${API_CONFIG.authBaseUrl}/users/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });
   } catch {
     throw new Error('Erro ao deletar conta');
   }
  },
};