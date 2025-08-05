export const isPdfUrl = (url?: string): boolean => {
  if (!url) return false;

  if (
    url.startsWith("data:application/pdf;base64,") ||
    url.startsWith("data:application/octet-stream;base64,") ||
    url.startsWith("data:;base64,") ||
    (url.startsWith("data:") && url.includes("base64") && url.length > 100)
  ) {
    return true;
  }

  if (url.startsWith("blob:")) {
    return true;
  }
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith(".pdf")) {
    return true;
  }

  if (lowerUrl.includes(".pdf?") || lowerUrl.includes(".pdf#")) {
    return true;
  }

  // Verificar tipo MIME em URL
  if (
    lowerUrl.includes("type=application/pdf") ||
    lowerUrl.includes("pdf") ||
    lowerUrl.includes("document")
  ) {
    return true;
  }

  if (url.length > 500 && /^[A-Za-z0-9+/=]+$/.test(url)) {
    return true;
  }

  return false;
};

export const getPdfFileName = (url: string): string => {
  try {
    if (url.startsWith("data:")) {
      return "documento.pdf";
    }

    if (url.startsWith("blob:")) {
      return "documento.pdf";
    }

    const urlObj = new URL(url, window.location.origin);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];

    if (fileName.toLowerCase().endsWith(".pdf")) {
      return fileName;
    }

    return `${fileName || "documento"}.pdf`;
  } catch (error) {
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1].split("?")[0];

    if (lastPart && lastPart.length > 0) {
      return lastPart.toLowerCase().endsWith(".pdf")
        ? lastPart
        : `${lastPart}.pdf`;
    }

    return "documento.pdf";
  }
};

export const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const isValidPdfFile = (file: File): boolean => {
  if (file.type === "application/pdf") {
    return true;
  }

  const fileName = file.name.toLowerCase();
  return fileName.endsWith(".pdf");
};
