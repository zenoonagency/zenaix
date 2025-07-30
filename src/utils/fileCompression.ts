interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

interface CompressionResult {
  success: boolean;
  file?: File;
  error?: string;
}

// Função para comprimir imagens
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeKB = 1024, // 1MB
  } = options;

  try {
    // Verificar se é uma imagem
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Arquivo não é uma imagem válida" };
    }

    // Se o arquivo já é pequeno, retornar como está
    if (file.size <= maxSizeKB * 1024) {
      return { success: true, file };
    }

    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Converter para blob com qualidade ajustável
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              // Se ainda estiver muito grande, reduzir qualidade
              if (compressedFile.size > maxSizeKB * 1024 && quality > 0.3) {
                canvas.toBlob(
                  (finalBlob) => {
                    if (finalBlob) {
                      const finalFile = new File([finalBlob], file.name, {
                        type: file.type,
                        lastModified: Date.now(),
                      });
                      resolve({ success: true, file: finalFile });
                    } else {
                      resolve({
                        success: false,
                        error: "Erro ao comprimir imagem",
                      });
                    }
                  },
                  file.type,
                  quality * 0.7
                );
              } else {
                resolve({ success: true, file: compressedFile });
              }
            } else {
              resolve({ success: false, error: "Erro ao comprimir imagem" });
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        resolve({ success: false, error: "Erro ao carregar imagem" });
      };

      img.src = URL.createObjectURL(file);
    });
  } catch (error) {
    return { success: false, error: "Erro inesperado ao comprimir imagem" };
  }
}

// Função para comprimir vídeos (reduzir qualidade)
export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxSizeKB = 10240 } = options; // 10MB para vídeos

  try {
    // Verificar se é um vídeo
    if (!file.type.startsWith("video/")) {
      return { success: false, error: "Arquivo não é um vídeo válido" };
    }

    // Se o arquivo já é pequeno, retornar como está
    if (file.size <= maxSizeKB * 1024) {
      return { success: true, file };
    }

    // Para vídeos, vamos usar uma abordagem mais simples
    // Como não podemos comprimir vídeo no browser facilmente,
    // vamos apenas verificar o tamanho e alertar o usuário
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

    return {
      success: false,
      error: `Vídeo muito grande (${sizeMB}MB). O tamanho máximo é ${(
        maxSizeKB / 1024
      ).toFixed(1)}MB.`,
    };
  } catch (error) {
    return { success: false, error: "Erro inesperado ao processar vídeo" };
  }
}

// Função para comprimir áudio
export async function compressAudio(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { maxSizeKB = 5120 } = options; // 5MB para áudios

  try {
    // Verificar se é um áudio
    if (!file.type.startsWith("audio/")) {
      return { success: false, error: "Arquivo não é um áudio válido" };
    }

    // Se o arquivo já é pequeno, retornar como está
    if (file.size <= maxSizeKB * 1024) {
      return { success: true, file };
    }

    // Para áudios, vamos apenas verificar o tamanho
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

    return {
      success: false,
      error: `Áudio muito grande (${sizeMB}MB). O tamanho máximo é ${(
        maxSizeKB / 1024
      ).toFixed(1)}MB.`,
    };
  } catch (error) {
    return { success: false, error: "Erro inesperado ao processar áudio" };
  }
}

// Função principal para comprimir qualquer tipo de arquivo
export async function compressFile(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  if (file.type.startsWith("image/")) {
    return compressImage(file, options);
  } else if (file.type.startsWith("video/")) {
    return compressVideo(file, options);
  } else if (file.type.startsWith("audio/")) {
    return compressAudio(file, options);
  } else {
    // Para outros tipos de arquivo, retornar como está
    return { success: true, file };
  }
}
