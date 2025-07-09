import { api } from './api';
import { isPdfUrl, getPdfFileName } from '../utils/pdfUtils';

/**
 * Serviço para gerenciar a visualização de PDFs contornando problemas de CORS
 */
export const pdfProxyService = {
  /**
   * Converte uma URL externa de PDF para uma URL de proxy ou blob URL
   * @param url URL original do PDF
   * @returns Uma URL que pode ser usada em um iframe sem problemas de CORS
   */
  getProxiedPdfUrl: async (url: string): Promise<string> => {
    try {
      console.log("pdfProxyService - URL original:", url.substring(0, 100) + (url.length > 100 ? "..." : ""));

      // Se a URL for undefined, null ou string vazia
      if (!url) {
        console.error("pdfProxyService - URL é undefined ou vazia");
        throw new Error("URL do PDF não foi fornecida");
      }

      // Verificar se a URL parece ser uma string base64 crua sem o prefixo data:
      if (url.length > 500 && /^[A-Za-z0-9+/=]+$/.test(url)) {
        console.log("pdfProxyService - Detectada possível string base64 crua");
        // Tenta converter para um data URL válido
        return `data:application/pdf;base64,${url}`;
      }

      // Verificar se a URL parece ser de um PDF
      if (!isPdfUrl(url) && !url.startsWith('blob:') && !url.startsWith('data:')) {
        console.warn("pdfProxyService - URL não parece ser de um PDF:", url.substring(0, 100) + "...");
        // Não vamos bloquear, apenas alertar no console
      }

      // Se já for uma URL base64 de qualquer tipo, retornar diretamente
      if (url.startsWith('data:')) {
        console.log("pdfProxyService - Detectada URL base64, retornando diretamente");
        
        // Se for base64 mas não tiver o tipo MIME correto, tentar corrigir
        if (!url.startsWith('data:application/pdf;base64,')) {
          if (url.includes(';base64,')) {
            // Converter para o tipo MIME correto
            const base64Part = url.split(';base64,')[1];
            return `data:application/pdf;base64,${base64Part}`;
          }
        }
        
        return url;
      }

      // Verificar se a URL é relativa
      if (url.startsWith('/')) {
        console.log("pdfProxyService - URL é relativa, adicionando origin");
        // É um caminho relativo dentro da aplicação, adicionamos a origin
        return `${window.location.origin}${url}`;
      }

      // Se a URL for um blob URL, retornar diretamente
      if (url.startsWith('blob:')) {
        console.log("pdfProxyService - URL já é um blob, retornando diretamente");
        return url;
      }

      // Verificar se a URL é da mesma origem
      try {
        const urlObj = new URL(url, window.location.origin);
        const isSameOrigin = urlObj.origin === window.location.origin;
        
        if (isSameOrigin) {
          console.log("pdfProxyService - URL é da mesma origem, retornando diretamente");
          return url;
        }
      } catch (error) {
        console.warn("pdfProxyService - Erro ao verificar origem da URL:", error);
        // Se houver erro ao analisar a URL, continuamos e tentamos outras abordagens
      }

      // Tentar converter a URL externa em um blob URL
      try {
        console.log("pdfProxyService - Tentando fetch da URL externa com CORS mode");
        const response = await fetch(url, { 
          mode: 'cors',
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
        
        if (!response.ok) {
          console.warn(`pdfProxyService - Resposta HTTP não ok: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log("pdfProxyService - Content-Type da resposta:", contentType);
        
        const blob = await response.blob();
        
        // Verificar se o blob é realmente um PDF - criar um novo blob com o tipo MIME correto
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        console.log("pdfProxyService - Blob URL criada com sucesso:", blobUrl);
        return blobUrl;
      } catch (error) {
        console.warn('pdfProxyService - Não foi possível fazer fetch do PDF diretamente:', error);
        
        // Tentar com modo no-cors
        try {
          console.log("pdfProxyService - Tentando fetch da URL externa com no-cors mode");
          const response = await fetch(url, { mode: 'no-cors' });
          const blob = await response.blob();
          
          // Forçar o tipo MIME correto
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(pdfBlob);
          
          console.log("pdfProxyService - Blob URL criada com no-cors:", blobUrl);
          return blobUrl;
        } catch (corsError) {
          console.warn('pdfProxyService - Falha também no fetch no-cors:', corsError);
        }
        
        // Se não conseguir acessar diretamente, retorna URL para o visualizador do Google
        console.log("pdfProxyService - Usando Google Docs Viewer como fallback");
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      }
    } catch (error) {
      console.error('pdfProxyService - Erro ao processar a URL do PDF:', error);
      throw error;
    }
  },

  /**
   * Gera um objeto Blob a partir de uma URL de PDF para download
   * @param url URL do PDF
   * @returns Um objeto com blobUrl e fileName para download
   */
  getPdfForDownload: async (url: string, fileName?: string): Promise<{ blobUrl: string, fileName: string }> => {
    try {
      console.log("pdfProxyService - Gerando arquivo para download:", url.substring(0, 100) + (url.length > 100 ? "..." : ""));
      
      // Determinar o nome do arquivo
      const downloadFileName = fileName || getPdfFileName(url);
      
      // Verificar se a URL parece ser uma string base64 crua sem o prefixo data:
      if (url.length > 500 && /^[A-Za-z0-9+/=]+$/.test(url)) {
        console.log("pdfProxyService - Detectada string base64 crua para download");
        
        // Construir um data URL completo
        const dataUrl = `data:application/pdf;base64,${url}`;
        
        // Converter para blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        return {
          blobUrl,
          fileName: downloadFileName
        };
      }
      
      // Se já for uma URL base64
      if (url.startsWith('data:')) {
        console.log("pdfProxyService - URL base64 detectada para download");
        
        // Se não for do tipo PDF, mas for base64, tentar corrigir
        let dataUrl = url;
        if (!url.startsWith('data:application/pdf;base64,') && url.includes(';base64,')) {
          const base64Part = url.split(';base64,')[1];
          dataUrl = `data:application/pdf;base64,${base64Part}`;
        }
        
        // Extrair o blob a partir da string base64
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        return {
          blobUrl,
          fileName: downloadFileName
        };
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Forçar o tipo MIME correto
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      return {
        blobUrl,
        fileName: downloadFileName
      };
    } catch (error) {
      console.error('pdfProxyService - Erro ao gerar arquivo para download:', error);
      throw error;
    }
  },

  /**
   * Verifica se um PDF está acessível
   * @param url URL do PDF
   * @returns True se o PDF pode ser acessado, false caso contrário
   */
  isPdfAccessible: async (url: string): Promise<boolean> => {
    try {
      // Se for base64 ou blob, está acessível
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        return true;
      }
      
      // Se for uma string base64 crua
      if (url.length > 500 && /^[A-Za-z0-9+/=]+$/.test(url)) {
        return true;
      }
      
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' 
      });
      return true;
    } catch (error) {
      console.error('pdfProxyService - PDF não está acessível:', error);
      return false;
    }
  }
}; 