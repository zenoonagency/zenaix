import { api } from './api';
import { isPdfUrl, getPdfFileName } from '../utils/pdfUtils';

export const pdfProxyService = {

  getProxiedPdfUrl: async (url: string): Promise<string> => {
    try {
      console.log("pdfProxyService - URL original:", url.substring(0, 100) + (url.length > 100 ? "..." : ""));

      if (!url) {
        console.error("pdfProxyService - URL é undefined ou vazia");
        throw new Error("URL do PDF não foi fornecida");
      }

      if (url.length > 500 && /^[A-Za-z0-9+/=]+$/.test(url)) {
        return `data:application/pdf;base64,${url}`;
      }

      // Verificar se a URL parece ser de um PDF
      if (!isPdfUrl(url) && !url.startsWith('blob:') && !url.startsWith('data:')) {
        console.warn("pdfProxyService - URL não parece ser de um PDF:", url.substring(0, 100) + "...");
      }

      if (url.startsWith('data:')) {
        
        if (!url.startsWith('data:application/pdf;base64,')) {
          if (url.includes(';base64,')) {
            const base64Part = url.split(';base64,')[1];
            return `data:application/pdf;base64,${base64Part}`;
          }
        }
        
        return url;
      }

      if (url.startsWith('/')) {
        return `${window.location.origin}${url}`;
      }

      if (url.startsWith('blob:')) {
        return url;
      }

      try {
        const urlObj = new URL(url, window.location.origin);
        const isSameOrigin = urlObj.origin === window.location.origin;
        
        if (isSameOrigin) {
          return url;
        }
      } catch (error) {
        console.warn("pdfProxyService - Erro ao verificar origem da URL:", error);
      }

      try {
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
        
        const blob = await response.blob();
        
        // Verificar se o blob é realmente um PDF - criar um novo blob com o tipo MIME correto
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        return blobUrl;
      } catch (error) {
        console.warn('pdfProxyService - Não foi possível fazer fetch do PDF diretamente:', error);
        
        try {
          const response = await fetch(url, { mode: 'no-cors' });
          const blob = await response.blob();
          
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(pdfBlob);
          
          return blobUrl;
        } catch (corsError) {
          console.warn('pdfProxyService - Falha também no fetch no-cors:', corsError);
        }
        
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      }
    } catch (error) {
      console.error('pdfProxyService - Erro ao processar a URL do PDF:', error);
      throw error;
    }
  },

  getPdfForDownload: async (url: string, fileName?: string): Promise<{ blobUrl: string, fileName: string }> => {
    try {
      console.log("pdfProxyService - Gerando arquivo para download:", url.substring(0, 100) + (url.length > 100 ? "..." : ""));
      
      const downloadFileName = fileName || getPdfFileName(url);
      
      if (url.length > 500 && /^[A-Za-z0-9+/=]+$/.test(url)) {
        
        const dataUrl = `data:application/pdf;base64,${url}`;
        
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        return {
          blobUrl,
          fileName: downloadFileName
        };
      }
      
      if (url.startsWith('data:')) {        
        let dataUrl = url;
        if (!url.startsWith('data:application/pdf;base64,') && url.includes(';base64,')) {
          const base64Part = url.split(';base64,')[1];
          dataUrl = `data:application/pdf;base64,${base64Part}`;
        }
        
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

  isPdfAccessible: async (url: string): Promise<boolean> => {
    try {
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        return true;
      }
      
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