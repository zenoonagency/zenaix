/**
 * Utilitário para compressão de imagens
 * Redimensiona e comprime imagens para caber dentro do limite de tamanho especificado
 */

export interface CompressionOptions {
  maxSizeKB: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/png" | "image/webp";
}

export interface CompressionResult {
  success: boolean;
  file?: File;
  error?: string;
  originalSize: number;
  compressedSize?: number;
}

/**
 * Comprime uma imagem para caber dentro do limite de tamanho especificado
 * @param file - Arquivo de imagem a ser comprimido
 * @param options - Opções de compressão
 * @returns Promise com o resultado da compressão
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = { maxSizeKB: 300 }
): Promise<CompressionResult> => {
  const {
    maxSizeKB = 300,
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.9,
    format = "image/jpeg",
  } = options;

  const maxSizeBytes = maxSizeKB * 1024;

  // Se o arquivo já está dentro do limite, retornar sem compressão
  if (file.size <= maxSizeBytes) {
    return {
      success: true,
      file,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve({
            success: false,
            error: "Erro ao processar imagem",
            originalSize: file.size,
          });
          return;
        }

        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Função recursiva para tentar diferentes níveis de qualidade
        const tryCompress = (
          currentQuality: number
        ): Promise<CompressionResult> => {
          return new Promise((resolveCompress) => {
            canvas.toBlob(
              (blob) => {
                if (blob && blob.size <= maxSizeBytes) {
                  const compressedFile = new File([blob], file.name, {
                    type: format,
                    lastModified: Date.now(),
                  });

                  resolveCompress({
                    success: true,
                    file: compressedFile,
                    originalSize: file.size,
                    compressedSize: blob.size,
                  });
                } else if (currentQuality > 0.1) {
                  // Tentar com qualidade menor
                  resolveCompress(tryCompress(currentQuality - 0.1));
                } else {
                  // Não foi possível comprimir o suficiente
                  resolveCompress({
                    success: false,
                    error: `Não foi possível comprimir a imagem para menos de ${maxSizeKB}KB`,
                    originalSize: file.size,
                  });
                }
              },
              format,
              currentQuality
            );
          });
        };

        // Iniciar compressão com a qualidade especificada
        tryCompress(quality).then(resolve);
      };

      img.onerror = () => {
        resolve({
          success: false,
          error: "Erro ao carregar imagem",
          originalSize: file.size,
        });
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: "Erro ao ler arquivo",
        originalSize: file.size,
      });
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Hook personalizado para compressão de imagem com feedback
 * @param options - Opções de compressão
 * @returns Função para comprimir imagem com feedback
 */
export const useImageCompression = (options?: CompressionOptions) => {
  const compressWithFeedback = async (
    file: File,
    onSuccess?: (result: CompressionResult) => void,
    onError?: (error: string) => void
  ): Promise<File | null> => {
    try {
      const result = await compressImage(file, options);

      if (result.success && result.file) {
        onSuccess?.(result);
        return result.file;
      } else {
        onError?.(result.error || "Erro desconhecido na compressão");
        return null;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro na compressão";
      onError?.(errorMessage);
      return null;
    }
  };

  return { compressWithFeedback };
};
