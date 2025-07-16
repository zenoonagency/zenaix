import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  RefreshCw,
  Info,
  ExternalLink,
  FileText,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { pdfProxyService } from "../services/pdfProxyService";
import { isPdfUrl, getPdfFileName } from "../utils/pdfUtils";
import { PDFDebugger } from "./PDFDebugger";
import { useAuthStore } from "../store/authStore";
import { useCustomModal } from "./CustomModal";

interface PDFViewerProps {
  fileUrl: string;
  showControls?: boolean;
  width?: string;
  height?: string;
  className?: string;
  contractId?: string; // Novo: id do contrato
  organizationId?: string; // Novo: id da organização
  onFileDeleted?: () => void; // Novo: callback após deletar
}

/**
 * Componente para visualização de PDFs contornando problemas de CORS
 */
export function PDFViewer({
  fileUrl,
  showControls = true,
  width = "100%",
  height = "600px",
  className = "",
  contractId,
  organizationId,
  onFileDeleted,
}: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [proxiedUrl, setProxiedUrl] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const { token } = useAuthStore();
  const [deleting, setDeleting] = useState(false);
  const { customConfirm, modal: customModalElement } = useCustomModal();

  useEffect(() => {
    if (fileUrl) {
      // Verifica se parece ser um PDF para log
      if (
        !isPdfUrl(fileUrl) &&
        !fileUrl.startsWith("blob:") &&
        !fileUrl.startsWith("data:")
      ) {
        console.warn("PDFViewer - URL não parece ser de um PDF:", fileUrl);
      }

      // Limpar qualquer objeto URL anterior
      if (proxiedUrl && proxiedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(proxiedUrl);
      }

      // Tenta carregar o PDF
      loadPdf();
    } else {
      setError("URL do arquivo PDF não fornecida");
      setLoading(false);
    }

    // Limpeza ao desmontar
    return () => {
      if (proxiedUrl && proxiedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(proxiedUrl);
      }
    };
  }, [fileUrl]);

  const loadPdf = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        "PDFViewer - Tentando carregar PDF da URL:",
        fileUrl.substring(0, 100) + (fileUrl.length > 100 ? "..." : "")
      );

      // Detecção aprimorada de tipo de arquivo
      let fileType = "unknown";
      if (fileUrl.startsWith("data:application/pdf;base64,")) {
        fileType = "base64-pdf";
      } else if (fileUrl.startsWith("data:")) {
        fileType = "base64-other";
      } else if (fileUrl.startsWith("blob:")) {
        fileType = "blob";
      } else if (fileUrl.toLowerCase().includes(".pdf")) {
        fileType = "pdf-url";
      } else if (fileUrl.length > 500 && /^[A-Za-z0-9+/=]+$/.test(fileUrl)) {
        fileType = "possibly-raw-base64";
      }

      console.log("PDFViewer - Tipo de arquivo detectado:", fileType);

      // Tratamento especial para diferentes tipos de URL
      if (fileType === "possibly-raw-base64") {
        // Tenta converter base64 raw para data URL
        const wrappedBase64 = `data:application/pdf;base64,${fileUrl}`;
        setProxiedUrl(wrappedBase64);
        setDebugInfo({
          originalUrl: fileUrl.substring(0, 50) + "...",
          urlType: fileType,
          method: "base64-conversion",
        });
        setLoading(false);
        return;
      }

      if (
        fileType === "base64-pdf" ||
        fileType === "base64-other" ||
        fileType === "blob"
      ) {
        // Usar diretamente
        setProxiedUrl(fileUrl);
        setDebugInfo({
          originalUrl: fileUrl.substring(0, 50) + "...",
          urlType: fileType,
          method: "direct",
        });
        setLoading(false);
        return;
      }

      // Para outros tipos, usar o serviço de proxy
      const url = await pdfProxyService.getProxiedPdfUrl(fileUrl);

      // Verifica se a URL é para o visualizador do Google (fallback)
      if (url.includes("docs.google.com/viewer")) {
        setFallbackMode(true);
      } else {
        setFallbackMode(false);
      }

      setProxiedUrl(url);
      setDebugInfo({
        originalUrl: fileUrl,
        proxiedUrl: url,
        urlType: fileType,
        method: url.includes("docs.google.com/viewer")
          ? "googleViewer"
          : url.startsWith("blob:")
          ? "blob"
          : "direct",
      });

      setLoading(false);
    } catch (error) {
      console.error("Erro ao processar URL do PDF:", error);
      setError(
        "Não foi possível carregar o PDF. Erro: " +
          (error instanceof Error ? error.message : String(error))
      );
      setLoading(false);
    }
  };

  const forceDirectView = async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar se a URL pode ser uma string base64 não formatada
      if (fileUrl.length > 500 && /^[A-Za-z0-9+/=]+$/.test(fileUrl)) {
        console.log(
          "PDFViewer - Detectada possível string base64 não formatada"
        );
        // Tenta converter base64 raw para data URL
        const wrappedBase64 = `data:application/pdf;base64,${fileUrl}`;
        setProxiedUrl(wrappedBase64);
        setDebugInfo({
          ...debugInfo,
          method: "base64-conversion",
          proxiedUrl: "data:application/pdf;base64,...",
        });
        setLoading(false);
        return;
      }

      // Usar diretamente a URL original
      setProxiedUrl(fileUrl);
      setFallbackMode(false);
      setDebugInfo({
        ...debugInfo,
        method: "forcedDirect",
        proxiedUrl: fileUrl,
      });
      setLoading(false);
    } catch (error) {
      console.error("Erro ao alternar para visualização direta:", error);
      setError("Erro ao alternar modo de visualização");
      setLoading(false);
    }
  };

  const switchViewMode = async () => {
    setLoading(true);
    setError(null);

    try {
      if (fallbackMode) {
        // Tenta carregar diretamente novamente
        const url = await pdfProxyService.getProxiedPdfUrl(fileUrl);
        setProxiedUrl(url);
        setFallbackMode(false);
        setDebugInfo({
          ...debugInfo,
          method: url.startsWith("blob:") ? "blob" : "direct",
          proxiedUrl: url,
        });
      } else {
        // Usa o visualizador do Google como fallback
        const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
          fileUrl
        )}&embedded=true`;
        setProxiedUrl(googleUrl);
        setFallbackMode(true);
        setDebugInfo({
          ...debugInfo,
          method: "googleViewer",
          proxiedUrl: googleUrl,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Erro ao alternar modo de visualização:", error);
      setError("Erro ao alternar modo de visualização");
      setLoading(false);
    }
  };

  const openInNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  const handleDownload = async () => {
    try {
      // Determinar o nome do arquivo
      const fileName = getPdfFileName(fileUrl);

      const { blobUrl, fileName: downloadFileName } =
        await pdfProxyService.getPdfForDownload(fileUrl, fileName);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      setError("Erro ao baixar o arquivo");
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    console.error("Erro ao carregar o PDF no iframe");
    setError(
      "Não foi possível exibir o PDF. Tentando visualização alternativa..."
    );
    // Tentar fallback
    switchViewMode();
  };

  const handleDeleteFile = async () => {
    if (!token || !organizationId || !contractId) {
      setError("Dados insuficientes para apagar o arquivo.");
      return;
    }
    const confirmed = await customConfirm(
      "Apagar arquivo",
      "Tem certeza que deseja apagar este arquivo?"
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await import("../services/contract/contract.service").then(
        ({ contractService }) =>
          contractService.deleteFile(token, organizationId, contractId)
      );
      setDeleting(false);
      if (onFileDeleted) onFileDeleted();
    } catch (err) {
      setDeleting(false);
      setError("Erro ao apagar o arquivo.");
      console.error(err);
    }
  };

  // Verificação adicional de URL
  const isValidPdfUrl = Boolean(
    proxiedUrl &&
      (proxiedUrl.startsWith("data:application/pdf") ||
        proxiedUrl.startsWith("blob:") ||
        proxiedUrl.includes("docs.google.com/viewer") ||
        isPdfUrl(proxiedUrl))
  );

  return (
    <div
      className={`relative border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/50 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7f00ff]"></div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Carregando PDF...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-dark-800 z-10">
          <div className="flex flex-col items-center max-w-md p-4 text-center">
            <div className="text-red-500 dark:text-red-400 mb-3 text-sm">
              <p>{error}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={loadPdf}
                className="px-3 py-1.5 text-xs bg-[#7f00ff] text-white rounded-lg hover:bg-[#7f00ff]/90"
              >
                Tentar Novamente
              </button>
              <button
                onClick={switchViewMode}
                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {fallbackMode ? "Visualização Direta" : "Google Viewer"}
              </button>
              <button
                onClick={forceDirectView}
                className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Forçar Visualização Direta
              </button>
              <button
                onClick={openInNewTab}
                className="px-3 py-1.5 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Abrir em Nova Aba
              </button>
              <button
                onClick={() => setShowDebugger(true)}
                className="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Diagnosticar
              </button>
            </div>
          </div>
        </div>
      )}

      {showControls && !error && (
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded bg-white dark:bg-dark-800 shadow-sm hover:bg-gray-100 dark:hover:bg-dark-700 text-[#7f00ff]"
            title="Download PDF"
            disabled={loading}
          >
            <Download size={16} />
          </button>
          <button
            onClick={switchViewMode}
            className="p-1.5 rounded bg-white dark:bg-dark-800 shadow-sm hover:bg-gray-100 dark:hover:bg-dark-700 text-blue-500"
            title={
              fallbackMode ? "Usar visualização direta" : "Usar Google Viewer"
            }
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="p-1.5 rounded bg-white dark:bg-dark-800 shadow-sm hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500"
            title="Informações de Depuração"
          >
            <Info size={16} />
          </button>
          <button
            onClick={openInNewTab}
            className="p-1.5 rounded bg-white dark:bg-dark-800 shadow-sm hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500"
            title="Abrir em Nova Aba"
          >
            <ExternalLink size={16} />
          </button>
          <button
            onClick={() => setShowDebugger(true)}
            className="p-1.5 rounded bg-white dark:bg-dark-800 shadow-sm hover:bg-gray-100 dark:hover:bg-dark-700 text-yellow-500"
            title="Diagnosticar PDF"
          >
            <AlertTriangle size={16} />
          </button>
          {contractId && organizationId && (
            <button
              onClick={handleDeleteFile}
              className="p-1.5 rounded bg-white dark:bg-dark-800 shadow-sm hover:bg-red-100 dark:hover:bg-red-900 text-red-500"
              title="Apagar arquivo PDF"
              disabled={deleting}
            >
              {deleting ? (
                <span className="animate-spin h-4 w-4 border-b-2 border-red-500 rounded-full block" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          )}
        </div>
      )}
      {customModalElement}

      {/* Informações de Depuração */}
      {showDebugInfo && (
        <div className="absolute top-10 right-2 bg-white dark:bg-dark-800 shadow-lg rounded p-3 z-30 text-xs overflow-auto max-w-xs max-h-[300px] border border-gray-200 dark:border-dark-600">
          <h4 className="font-bold mb-2 text-gray-800 dark:text-gray-200">
            Informações de Depuração
          </h4>
          <div className="space-y-1 text-gray-700 dark:text-gray-300">
            <p>
              <strong>URL Original:</strong>{" "}
              {fileUrl
                ? fileUrl.length > 50
                  ? fileUrl.substring(0, 50) + "..."
                  : fileUrl
                : "Nenhuma"}
            </p>
            <p>
              <strong>URL Utilizada:</strong>{" "}
              {proxiedUrl
                ? proxiedUrl.length > 50
                  ? proxiedUrl.substring(0, 50) + "..."
                  : proxiedUrl
                : "Nenhuma"}
            </p>
            <p>
              <strong>Tipo de URL:</strong>{" "}
              {debugInfo.urlType || "Desconhecido"}
            </p>
            <p>
              <strong>Método:</strong> {debugInfo.method || "Nenhum"}
            </p>
            <p>
              <strong>Modo Fallback:</strong> {fallbackMode ? "Sim" : "Não"}
            </p>
            <p>
              <strong>É PDF válido:</strong> {isValidPdfUrl ? "Sim" : "Não"}
            </p>
          </div>
        </div>
      )}

      {proxiedUrl && isValidPdfUrl ? (
        <iframe
          ref={iframeRef}
          src={proxiedUrl}
          className="w-full h-full border-none"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Visualizador de PDF"
          sandbox={
            fallbackMode ? "allow-scripts allow-same-origin allow-forms" : ""
          }
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-900">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs px-6">
            {loading
              ? "Carregando documento..."
              : "Erro ao carregar documento PDF"}
          </p>
          {!loading && (
            <button
              onClick={() => setShowDebugger(true)}
              className="mt-4 px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Diagnosticar Problema
            </button>
          )}
        </div>
      )}

      {showDebugger && (
        <PDFDebugger fileUrl={fileUrl} onClose={() => setShowDebugger(false)} />
      )}
    </div>
  );
}
