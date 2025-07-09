/**
 * Utilitários para lidar com arquivos PDF
 */

/**
 * Verifica se uma string de URL ou data URI parece ser um arquivo PDF.
 * @param url String URL ou data URI para verificar
 * @returns true se parecer ser um PDF, false caso contrário
 */
export const isPdfUrl = (url?: string): boolean => {
  if (!url) return false;
  
  // Log para depuração
  console.log("isPdfUrl - Verificando URL:", url.substring(0, 100) + (url.length > 100 ? "..." : ""));
  
  // Verificar URL base64 - mais permissivo para compatibilidade
  if (url.startsWith('data:application/pdf;base64,') || 
      url.startsWith('data:application/octet-stream;base64,') ||
      url.startsWith('data:;base64,') ||
      (url.startsWith('data:') && url.includes('base64') && url.length > 100)) {
    console.log("isPdfUrl - Detectado como base64");
    return true;
  }
  
  // Verificar blob URL (indicação de que é um arquivo que acabou de ser carregado)
  if (url.startsWith('blob:')) {
    console.log("isPdfUrl - Detectado como blob URL");
    return true;
  }
  
  // Verificar extensão de arquivo
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith('.pdf')) {
    console.log("isPdfUrl - Detectado por extensão .pdf");
    return true;
  }
  
  // Verificar URL com parâmetros
  if (lowerUrl.includes('.pdf?') || lowerUrl.includes('.pdf#')) {
    console.log("isPdfUrl - Detectado com parâmetros .pdf?/# em URL");
    return true;
  }
  
  // Verificar tipo MIME em URL
  if (lowerUrl.includes('type=application/pdf') || lowerUrl.includes('pdf') || lowerUrl.includes('document')) {
    console.log("isPdfUrl - Detectado por palavras-chave 'pdf/document' na URL");
    return true;
  }
  
  // Verificar strings base64 longas que podem ser PDFs
  if (url.length > 500 && /^[A-Za-z0-9+/=]+$/.test(url)) {
    console.log("isPdfUrl - Possível string base64 longa detectada");
    return true;
  }
  
  console.log("isPdfUrl - URL não reconhecida como PDF");
  return false;
};

/**
 * Extrai o nome do arquivo de uma URL de PDF
 * @param url URL do PDF
 * @returns Nome do arquivo extraído ou nome padrão se não for possível extrair
 */
export const getPdfFileName = (url: string): string => {
  try {
    // Se for uma URL base64, retornar nome padrão
    if (url.startsWith('data:')) {
      return 'documento.pdf';
    }
    
    // Verificar se é uma URL blob
    if (url.startsWith('blob:')) {
      return 'documento.pdf';
    }
    
    // Tentar extrair da URL
    const urlObj = new URL(url, window.location.origin);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // Se o nome do arquivo contiver extensão PDF
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return fileName;
    }
    
    // Caso contrário, adicionar extensão
    return `${fileName || 'documento'}.pdf`;
  } catch (error) {
    // Se falhar ao analisar a URL, extrair o que for possível da string
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1].split('?')[0];
    
    if (lastPart && lastPart.length > 0) {
      return lastPart.toLowerCase().endsWith('.pdf') ? lastPart : `${lastPart}.pdf`;
    }
    
    return 'documento.pdf';
  }
};

/**
 * Converte um File ou Blob para uma data URL (base64)
 * @param file Arquivo ou Blob para converter
 * @returns Promise com a data URL
 */
export const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Verifica se um objeto File é um PDF válido
 * @param file Arquivo para verificar
 * @returns true se for um PDF válido, false caso contrário
 */
export const isValidPdfFile = (file: File): boolean => {
  // Verificar o tipo MIME
  if (file.type === 'application/pdf') {
    return true;
  }
  
  // Verificar a extensão do nome do arquivo
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.pdf');
}; 