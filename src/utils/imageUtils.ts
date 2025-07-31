/**
 * Utilitários para processamento e validação de imagens
 */

/**
 * Verifica se uma string é um base64 válido
 * @param str String para verificar
 * @returns true se for um base64 válido
 */
export function isBase64(str: string): boolean {
  if (!str) return false;

  // Verificar se é uma data URI (já tem o prefixo)
  if (str.startsWith("data:")) {
    return true;
  }

  // Limpar a string antes de verificar
  const sanitized = str.trim();

  // Verificar características básicas de uma string base64
  if (sanitized.length % 4 !== 0) {
    return false;
  }

  // Verificar se contém apenas caracteres válidos de base64
  const regex = /^[A-Za-z0-9+/=]+$/;
  if (!regex.test(sanitized)) {
    return false;
  }

  // Verificar a densidade de caracteres não-alfanuméricos
  // Base64 válido geralmente tem uma certa densidade de caracteres especiais
  const specialChars = sanitized.match(/[+/=]/g);
  const specialCharDensity = specialChars
    ? specialChars.length / sanitized.length
    : 0;

  // Se a string for muito longa (> 100 caracteres) e tiver uma densidade razoável de caracteres especiais
  if (sanitized.length > 100 && specialCharDensity > 0.01) {
    return true;
  }

  // Para strings curtas, verificação mais rigorosa
  try {
    return btoa(atob(sanitized)) === sanitized;
  } catch (err) {
    return false;
  }
}

/**
 * Detecta o tipo de conteúdo a partir de uma string base64
 * @param base64String String base64 para analisar
 * @returns Objeto com o tipo de arquivo e MIME type
 */
export function detectContentType(base64String: string): {
  fileType: string;
  mimeType: string;
} {
  // Verificar se já é uma data URI
  if (base64String.startsWith("data:")) {
    const mimeMatch = base64String.match(/data:([^;]+);/);

    if (mimeMatch && mimeMatch[1]) {
      const mime = mimeMatch[1].toLowerCase();

      if (mime.startsWith("image/")) {
        return { fileType: "image", mimeType: mime };
      } else if (mime.startsWith("audio/")) {
        return { fileType: "audio", mimeType: mime };
      } else if (mime.startsWith("video/")) {
        return { fileType: "video", mimeType: mime };
      } else {
        return { fileType: "document", mimeType: mime };
      }
    }
  }

  // Verificar os primeiros caracteres do base64 decodificado para identificar o tipo
  let prefix: string;

  try {
    // Tratar caso a string já tenha sido processada e perdido parte do início
    if (base64String.length > 100) {
      // Tentamos identificar pelo padrão de bytes
      const raw = atob(base64String.slice(0, 100));
      prefix = Array.from(raw)
        .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("");
    } else {
      prefix = "";
    }
  } catch (e) {
    // Se não conseguir decodificar, assumir documento
    return { fileType: "document", mimeType: "application/octet-stream" };
  }

  // Identificar pelo magic number
  if (prefix.startsWith("ffd8ff")) {
    return { fileType: "image", mimeType: "image/jpeg" };
  } else if (prefix.startsWith("89504e47")) {
    return { fileType: "image", mimeType: "image/png" };
  } else if (prefix.startsWith("47494638")) {
    return { fileType: "image", mimeType: "image/gif" };
  } else if (prefix.startsWith("52494646") && prefix.includes("57454250")) {
    return { fileType: "image", mimeType: "image/webp" };
  } else if (prefix.startsWith("424d")) {
    return { fileType: "image", mimeType: "image/bmp" };
  } else if (prefix.startsWith("49443")) {
    return { fileType: "audio", mimeType: "audio/mpeg" };
  } else if (prefix.startsWith("fff")) {
    return { fileType: "audio", mimeType: "audio/mpeg" };
  } else if (prefix.startsWith("494433")) {
    return { fileType: "audio", mimeType: "audio/mpeg" };
  } else if (prefix.startsWith("1a45dfa3")) {
    return { fileType: "video", mimeType: "video/webm" };
  } else if (prefix.startsWith("000001") || prefix.startsWith("000000")) {
    return { fileType: "video", mimeType: "video/mp4" };
  } else if (prefix.startsWith("25504446")) {
    return { fileType: "document", mimeType: "application/pdf" };
  } else if (prefix.startsWith("504b0304")) {
    return { fileType: "document", mimeType: "application/zip" };
  }

  // Se não for possível identificar pelo conteúdo, verificar pelo comprimento
  if (base64String.length > 1000) {
    // Strings base64 longas geralmente são imagens
    return { fileType: "image", mimeType: "image/jpeg" };
  }

  // Fallback para documento
  return { fileType: "document", mimeType: "application/octet-stream" };
}

/**
 * Verifica se uma string é uma URL válida
 * @param str String para verificar
 * @returns true se for uma URL válida
 */
export function isValidUrl(str: string): boolean {
  if (!str) return false;

  // Aceitar URLs sem protocolo (começando com //)
  if (str.startsWith("//")) {
    str = "https:" + str;
  }

  // Aceitar URLs relativas que começam com /
  if (str.startsWith("/") && !str.startsWith("//")) {
    return true;
  }

  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Converte uma string base64 para uma data URI
 * @param base64 String base64 para converter
 * @param mimeType Tipo MIME para a data URI (padrão: image/jpeg)
 * @returns Data URI
 */
export function base64ToDataUri(
  base64: string,
  mimeType: string = "image/jpeg"
): string {
  // Se já for uma data URI, retornar como está
  if (base64.startsWith("data:")) {
    return base64;
  }

  // Limpar a string base64
  const sanitized = sanitizeBase64(base64);

  // Retornar a data URI
  return `data:${mimeType};base64,${sanitized}`;
}

/**
 * Limpa uma string base64 para garantir que está em um formato válido
 * @param base64 String base64 para limpar
 * @returns String base64 limpa
 */
export function sanitizeBase64(base64: string): string {
  // Verificar se é uma data URI e extrair apenas a parte base64
  if (base64.includes(";base64,")) {
    base64 = base64.split(";base64,")[1];
  }

  // Remover qualquer caractere não permitido em base64
  return base64.replace(/[^A-Za-z0-9+/=]/g, "");
}

/**
 * Cria uma URL de proxy para uma imagem para evitar problemas de CORS
 * @param imageUrl URL da imagem original
 * @returns URL do proxy
 */
export function createProxyImageUrl(imageUrl: string): string {
  // Normalizar URL
  if (imageUrl.startsWith("//")) {
    imageUrl = "https:" + imageUrl;
  }

  // Usar Cloudinary como proxy de imagem
  // Formato: https://res.cloudinary.com/demo/image/fetch/[URL]
  return `https://res.cloudinary.com/demo/image/fetch/${encodeURIComponent(
    imageUrl
  )}`;
}

/**
 * Processa uma URL de imagem para garantir que é válida e segura
 * @param src URL ou conteúdo da imagem
 * @returns URL processada
 */
export function processImageUrl(src: string): string {
  if (!src) {
    console.error("URL de imagem vazia recebida");
    return "";
  }

  // Se já for uma data URI para qualquer tipo de imagem, retornar como está
  if (src.startsWith("data:image/")) {
    return src;
  }

  // Se já for uma data URI, mas não for de imagem, tentar extrair o conteúdo e converter
  if (src.startsWith("data:") && src.includes(";base64,")) {
    try {
      // Extrair apenas o conteúdo base64
      const base64Content = src.split(";base64,")[1];
      // Detectar o tipo de conteúdo
      const { fileType, mimeType } = detectContentType(base64Content);

      if (fileType === "image") {
        return `data:${mimeType};base64,${base64Content}`;
      }
    } catch (error) {
      console.error("processImageUrl - Erro ao processar data URI:", error);
    }
  }

  // Se for um base64 sem o prefixo data:, adicionar o prefixo
  if (isBase64(src)) {
    try {
      // Tentar detectar o tipo de conteúdo para usar o MIME type correto
      const { fileType, mimeType } = detectContentType(src);
      if (fileType === "image") {
        return base64ToDataUri(src, mimeType);
      } else {
        // Se não for reconhecido como imagem, usar jpeg como fallback
        return base64ToDataUri(src, "image/jpeg");
      }
    } catch (error) {
      console.error("processImageUrl - Erro ao processar base64:", error);
      // Fallback para jpeg se houver erro na detecção
      return base64ToDataUri(src, "image/jpeg");
    }
  }

  // Corrigir URLs sem protocolo
  if (src.startsWith("//")) {
    src = "https:" + src;
  }

  // Verificar se é uma URL relativa
  if (src.startsWith("/") && !src.startsWith("//")) {
    // Converter para URL absoluta usando a origem atual
    src = window.location.origin + src;
  }

  // Se for uma URL normal, verificar se precisa de proxy
  if (isValidUrl(src)) {
    // Verificar se é uma URL externa (diferente da origem atual)
    const isSameOrigin = src.startsWith(window.location.origin);

    // Se for uma URL externa, usar proxy para evitar problemas de CORS
    if (!isSameOrigin && src.startsWith("http")) {
      return createProxyImageUrl(src);
    }

    return src;
  }

  // Verificar se parece ser base64 (algumas mensagens podem ter o início corrompido)
  if (src.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(src.substring(0, 100))) {
    try {
      // Limpar possíveis caracteres inválidos
      const cleaned = src.replace(/[^A-Za-z0-9+/=]/g, "");

      // Garantir que o comprimento seja múltiplo de 4 (requisito do base64)
      let padded = cleaned;
      const remainder = padded.length % 4;
      if (remainder > 0) {
        padded += "=".repeat(4 - remainder);
      }

      return base64ToDataUri(padded, "image/jpeg");
    } catch (error) {
      console.error("processImageUrl - Falha ao corrigir base64:", error);
    }
  }

  // Se chegar aqui, o formato não é reconhecido, retornar vazio
  console.error("processImageUrl - Formato de imagem não reconhecido");
  return "";
}

/**
 * Processa uma URL de mídia do WhatsApp para garantir que é válida e segura
 * @param mediaUrl URL da mídia
 * @param mediaType Tipo da mídia (opcional)
 * @returns URL processada
 */
export function processWhatsAppMediaUrl(
  mediaUrl: string,
  mediaType?: string
): string {
  if (!mediaUrl) {
    console.error("URL de mídia vazia recebida");
    return "";
  }

  // Se já for uma data URI, retornar como está
  if (mediaUrl.startsWith("data:")) {
    return mediaUrl;
  }

  // Corrigir URLs sem protocolo
  if (mediaUrl.startsWith("//")) {
    mediaUrl = "https:" + mediaUrl;
  }

  // Verificar se é uma URL relativa
  if (mediaUrl.startsWith("/") && !mediaUrl.startsWith("//")) {
    mediaUrl = window.location.origin + mediaUrl;
  }

  // Se for uma URL do WhatsApp (pps.whatsapp.net), usar proxy para imagens
  if (
    mediaUrl.includes("pps.whatsapp.net") &&
    mediaType?.startsWith("image/")
  ) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(
      mediaUrl
    )}&w=800&h=600&fit=cover&output=webp`;
  }

  // NÃO usar proxy para Supabase, localhost, ou domínio atual
  const isSupabase = mediaUrl.includes("supabase.co");
  const isLocalhost =
    mediaUrl.includes("localhost") || mediaUrl.includes("127.0.0.1");
  const isSameOrigin =
    mediaUrl.startsWith(window.location.origin) ||
    mediaUrl.includes(window.location.hostname);
  if (isSupabase || isLocalhost || isSameOrigin) {
    return mediaUrl;
  }

  // Proxy só para imagens externas (CORS)
  if (mediaType?.startsWith("image/") && mediaUrl.startsWith("http")) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(
      mediaUrl
    )}&w=800&h=600&fit=cover&output=webp`;
  }

  return mediaUrl;
}
