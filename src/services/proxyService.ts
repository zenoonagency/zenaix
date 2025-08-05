/**
 * Serviço de Proxy para gerenciar requisições para APIs externas
 * Contorna problemas de CORS usando o proxy local do Vite
 */

// Usando o proxy local configurado no vite.config.ts
const BASE_URL = '/webhook';

interface ProxyOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ProxyService {
  private readonly defaultOptions: ProxyOptions = {
    timeout: 15000,  // 15 segundos
    retries: 2,
    retryDelay: 1000
  };

  /**
   * Encaminha uma requisição para o endpoint N8N, contornando problemas de CORS
   * usando o proxy local configurado no vite.config.ts
   */
  async proxyRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    options: ProxyOptions = {},
    isFormData = false
  ): Promise<Response> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const url = `${BASE_URL}/${endpoint}`;
    
    // Configura headers para a requisição
    const headers: Record<string, string> = isFormData
      ? {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      : {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        };
    
    // Configurações da requisição
    const config: RequestInit = {
      method,
      headers,
      mode: 'cors',
      ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {})
    };
    
    // Implementando retry logic
    let lastError: Error | null = null;
    let retryCount = 0;
    
    while (retryCount <= mergedOptions.retries!) {
      try {
        // Adicionar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), mergedOptions.timeout);
        
        config.signal = controller.signal;
        
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        
        return response;
      } catch (error: any) {
        console.error(`ProxyService: Erro na tentativa ${retryCount + 1} para ${url}:`, error);
        lastError = error;
        retryCount++;
        
        // Se ultrapassamos o número de tentativas, lança o último erro
        if (retryCount > mergedOptions.retries!) {
          break;
        }
        
        // Espera antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, mergedOptions.retryDelay));
      }
    }
    
    // Se chegou aqui, falhou em todas as tentativas
    console.error(`ProxyService: Todas as tentativas falharam para ${url}`);
    throw lastError || new Error(`Falha ao fazer requisição para ${url}`);
  }

  /**
   * Wrapper para facilitar chamadas POST
   */
  async post(endpoint: string, body: any, options?: ProxyOptions): Promise<Response> {
    try {
      const response = await this.proxyRequest(endpoint, 'POST', body, options);
      
      // Verificar se há erro 500 (Internal Server Error)
      if (response.status === 500) {
        console.warn(`ProxyService: Erro 500 ao acessar ${endpoint}. Aplicando lógica de fallback.`);
        return this.handle500Error(endpoint, response);
      }
      
      return response;
    } catch (error) {
      console.error(`ProxyService: Erro ao fazer POST para ${endpoint}:`, error);
      // Criar uma resposta sintética para manter a consistência da API
      const syntheticResponse = new Response(
        JSON.stringify([]), 
        { 
          status: 200, 
          headers: {'Content-Type': 'application/json'}
        }
      );
      return syntheticResponse;
    }
  }

  /**
   * Wrapper para facilitar chamadas GET
   */
  async get(endpoint: string, options?: ProxyOptions): Promise<Response> {
    try {
      const response = await this.proxyRequest(endpoint, 'GET', undefined, options);
      
      // Verificar se há erro 500 (Internal Server Error)
      if (response.status === 500) {
        console.warn(`ProxyService: Erro 500 ao acessar ${endpoint}. Aplicando lógica de fallback.`);
        return this.handle500Error(endpoint, response);
      }
      
      return response;
    } catch (error) {
      console.error(`ProxyService: Erro ao fazer GET para ${endpoint}:`, error);
      // Criar uma resposta sintética para manter a consistência da API
      const syntheticResponse = new Response(
        JSON.stringify([]), 
        { 
          status: 200, 
          headers: {'Content-Type': 'application/json'}
        }
      );
      return syntheticResponse;
    }
  }
  
  /**
   * Wrapper para facilitar chamadas POST com FormData (para upload de arquivos)
   */
  async postFormData(endpoint: string, formData: FormData, options?: ProxyOptions): Promise<Response> {
    try {
      const response = await this.proxyRequest(endpoint, 'POST', formData, options, true);
      
      // Verificar se há erro 500 (Internal Server Error)
      if (response.status === 500) {
        console.warn(`ProxyService: Erro 500 ao acessar ${endpoint} com FormData. Aplicando lógica de fallback.`);
        return this.handle500Error(endpoint, response);
      }
      
      return response;
    } catch (error) {
      console.error(`ProxyService: Erro ao fazer POST com FormData para ${endpoint}:`, error);
      // Criar uma resposta sintética para manter a consistência da API
      const syntheticResponse = new Response(
        JSON.stringify({success: false, message: 'Erro ao comunicar com o servidor'}), 
        { 
          status: 200, 
          headers: {'Content-Type': 'application/json'}
        }
      );
      return syntheticResponse;
    }
  }
  
  /**
   * Método para lidar com erros 500 de forma específica
   * Retorna uma resposta com dados fictícios que podem ser usados pela aplicação
   */
  private handle500Error(endpoint: string, errorResponse: Response): Response {
    // Log detalhado do erro
    console.warn(`ProxyService: Tratando erro 500 para ${endpoint}`);
    
    // Endpoints específicos podem ter diferentes respostas padrão
    if (endpoint === 'whatsapp-contacts') {
      // Criar dados fictícios para contatos
      const mockContacts = [
        {
          id: 'mock-1',
          name: 'Contato Temporário 1',
          phone: '+5511999999991',
          lastMessage: 'Servidor temporariamente indisponível...',
          lastMessageTime: new Date().toISOString(),
          status: 'online',
          instance: 'WhatsApp'
        },
        {
          id: 'mock-2',
          name: 'Contato Temporário 2',
          phone: '+5511999999992',
          lastMessage: 'Aguardando conexão com servidor...',
          lastMessageTime: new Date().toISOString(),
          status: 'online',
          instance: 'WhatsApp'
        }
      ];
      
      // Criar uma resposta sintética com status 200
      return new Response(
        JSON.stringify(mockContacts), 
        { 
          status: 200, 
          headers: {'Content-Type': 'application/json'}
        }
      );
    }
    
    if (endpoint === 'whatsapp-messages') {
      // Criar dados fictícios para mensagens
      const mockMessages = [
        {
          id: `mock-msg-${Date.now()}-1`,
          content: 'Servidor temporariamente indisponível. Tente novamente mais tarde.',
          contentType: 'text',
          sender: 'contact',
          timestamp: new Date().toISOString(),
          status: 'delivered'
        }
      ];
      
      // Criar uma resposta sintética com status 200
      return new Response(
        JSON.stringify(mockMessages), 
        { 
          status: 200, 
          headers: {'Content-Type': 'application/json'}
        }
      );
    }
    
    // Para outros endpoints, retorna array vazio (padrão seguro)
    return new Response(
      JSON.stringify([]), 
      { 
        status: 200, 
        headers: {'Content-Type': 'application/json'}
      }
    );
  }

  /**
   * Verifica o status da conexão do WhatsApp
   */
  async checkWhatsAppStatus(name: string): Promise<{resposta: string}> {
    try {
      const response = await this.post('whatsapp-status', { name });
      
      if (!response.ok) {
        console.error(`ProxyService: Erro ao verificar status - ${response.status} ${response.statusText}`);
        return { resposta: 'inativo' };
      }
      
      const text = await response.text();
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error(`ProxyService: Erro ao parsear resposta JSON:`, e);
        return { resposta: text.includes('ativo') ? 'ativo' : 'inativo' };
      }
    } catch (error) {
      console.error(`ProxyService: Exceção ao verificar status:`, error);
      return { resposta: 'inativo' };
    }
  }
}

export const proxyService = new ProxyService(); 