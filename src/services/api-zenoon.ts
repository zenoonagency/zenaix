import axios from 'axios';

const BASE_URL = 'https://zenoon-agency-n8n.htm57w.easypanel.host';

interface Board {
  id: string;
  title: string;
  description: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateBoardRequest {
  title: string;
  description?: string;
  color?: string;
  order?: number;
}

type CreateBoardResponse = Board;

interface UpdateBoardRequest {
  title?: string;
  description?: string;
  color?: string;
  order?: number;
}

type UpdateBoardResponse = Board;

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export class ZenoonAPI {
  private static instance: ZenoonAPI;
  private readonly api;

  private constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  public static getInstance(): ZenoonAPI {
    if (!ZenoonAPI.instance) {
      ZenoonAPI.instance = new ZenoonAPI();
    }
    return ZenoonAPI.instance;
  }

  /**
   * Faz login na API e obtém o token de autenticação
   * @param data Dados de login (email e senha)
   * @returns Promise com o token e dados do usuário
   * @throws Error se a requisição falhar
   * 
   * @example
   * ```typescript
   * const api = ZenoonAPI.getInstance();
   * try {
   *   const { token, user } = await api.login({
   *     email: 'seu@email.com',
   *     password: 'sua-senha'
   *   });
   *   console.log('Login realizado:', { token, user });
   * } catch (error) {
   *   console.error('Erro ao fazer login:', error);
   * }
   * ```
   */
  public async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.api.post('/webhook/login', data);
      const { token, user } = response.data;
      
      // Salva o token no localStorage
      localStorage.setItem('auth_token', token);
      
      return { token, user };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Erro ao fazer login');
      }
      throw error;
    }
  }

  /**
   * Lista todos os boards do kanban
   * @returns Promise com a lista de boards
   * @throws Error se a requisição falhar
   * 
   * @example
   * ```typescript
   * const api = ZenoonAPI.getInstance();
   * try {
   *   const boards = await api.listBoards();
   *   console.log('Boards:', boards);
   * } catch (error) {
   *   console.error('Erro ao listar boards:', error);
   * }
   * ```
   */
  public async listBoards(): Promise<Board[]> {
    try {
      const response = await this.api.get('/webhook/boards/list');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Erro ao listar boards');
      }
      throw error;
    }
  }

  /**
   * Cria um novo board no kanban
   * @param data Dados do board a ser criado
   * @returns Promise com os dados do board criado
   * @throws Error se a requisição falhar
   * 
   * @example
   * ```typescript
   * const api = ZenoonAPI.getInstance();
   * try {
   *   const board = await api.createBoard({
   *     title: 'Novo Board',
   *     description: 'Descrição do board',
   *     color: '#7f00ff'
   *   });
   *   console.log('Board criado:', board);
   * } catch (error) {
   *   console.error('Erro ao criar board:', error);
   * }
   * ```
   */
  public async createBoard(data: CreateBoardRequest): Promise<CreateBoardResponse> {
    try {
      const response = await this.api.post('/webhook/boards/create', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Erro ao criar board');
      }
      throw error;
    }
  }

  /**
   * Atualiza um board existente no kanban
   * @param id ID do board a ser atualizado
   * @param data Dados a serem atualizados
   * @returns Promise com os dados do board atualizado
   * @throws Error se a requisição falhar
   * 
   * @example
   * ```typescript
   * const api = ZenoonAPI.getInstance();
   * try {
   *   const board = await api.updateBoard('123', {
   *     title: 'Novo Título',
   *     color: '#ff0000'
   *   });
   *   console.log('Board atualizado:', board);
   * } catch (error) {
   *   console.error('Erro ao atualizar board:', error);
   * }
   * ```
   */
  public async updateBoard(id: string, data: UpdateBoardRequest): Promise<UpdateBoardResponse> {
    try {
      const response = await this.api.put(`/webhook/boards/update/${id}`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Erro ao atualizar board');
      }
      throw error;
    }
  }

  /**
   * Deleta um board do kanban
   * @param id ID do board a ser deletado
   * @returns Promise void
   * @throws Error se a requisição falhar
   * 
   * @example
   * ```typescript
   * const api = ZenoonAPI.getInstance();
   * try {
   *   await api.deleteBoard('123');
   *   console.log('Board deletado com sucesso');
   * } catch (error) {
   *   console.error('Erro ao deletar board:', error);
   * }
   * ```
   */
  public async deleteBoard(id: string): Promise<void> {
    try {
      await this.api.delete(`/webhook/boards/delete/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Erro ao deletar board');
      }
      throw error;
    }
  }
} 