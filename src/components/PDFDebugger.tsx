import React, { useState } from "react";
import {
  Eye,
  FileText,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Code,
} from "lucide-react";
import { isPdfUrl } from "../utils/pdfUtils";
import { useThemeStore } from "../store/themeStore";

interface PDFDebuggerProps {
  fileUrl: string;
  onClose: () => void;
}

export function PDFDebugger({ fileUrl, onClose }: PDFDebuggerProps) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [showRawData, setShowRawData] = useState(false);
  const [showBase64, setShowBase64] = useState(false);

  // Analisa a URL do PDF
  const analyze = () => {
    // Verificar se é uma URL
    let isUrl = false;
    try {
      new URL(fileUrl);
      isUrl = true;
    } catch (e) {
      isUrl = false;
    }

    // Verificar se é data:URL
    const isDataUrl = fileUrl.startsWith("data:");

    // Verificar se é blob URL
    const isBlobUrl = fileUrl.startsWith("blob:");

    // Verificar se é uma URL externa
    const isExternalUrl =
      isUrl &&
      !isBlobUrl &&
      !isDataUrl &&
      !fileUrl.startsWith(window.location.origin);

    // Verificar se parece ser base64 puro
    const isPureBase64 =
      /^[A-Za-z0-9+/=]+$/.test(fileUrl) && fileUrl.length > 100;

    // Verificar se é reconhecido como PDF
    const recognizedAsPdf = isPdfUrl(fileUrl);

    return {
      isUrl,
      isDataUrl,
      isBlobUrl,
      isExternalUrl,
      isPureBase64,
      recognizedAsPdf,
      length: fileUrl.length,
    };
  };

  const analysis = analyze();

  const getFixSuggestion = () => {
    if (analysis.isPureBase64) {
      return "O URL parece ser uma string base64 sem o prefixo correto. Tente envolver com 'data:application/pdf;base64,'";
    }

    if (analysis.isDataUrl && !fileUrl.includes("application/pdf")) {
      return "O URL é data:URL mas não especifica o tipo correto. O tipo deveria ser 'application/pdf'";
    }

    if (analysis.isExternalUrl) {
      return "O URL é externo. Pode haver problemas de CORS ao carregar diretamente. Use um proxy ou servidor para fazer o fetch.";
    }

    if (!analysis.recognizedAsPdf) {
      return "O URL não parece ser de um PDF. Verifique se o arquivo é realmente um PDF e se a URL está completa.";
    }

    return "Não foram detectados problemas óbvios com a URL.";
  };

  const truncateBase64 = (str: string) => {
    if (str.length > 1000) {
      return str.substring(0, 500) + "..." + str.substring(str.length - 500);
    }
    return str;
  };

  const downloadAsTextFile = () => {
    const element = document.createElement("a");
    const file = new Blob([fileUrl], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "pdf-url-debug.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="modal-overlay z-[9999] p-4">
      <div
        className={`w-full max-w-3xl ${
          isDark ? "bg-dark-800 text-gray-200" : "bg-white text-gray-800"
        } rounded-lg shadow-xl overflow-hidden`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? "border-dark-600" : "border-gray-200"
          }`}
        >
          <h3 className="text-lg font-medium">Depurador de PDF</h3>
          <button
            onClick={onClose}
            className={`${
              isDark ? "hover:bg-dark-700" : "hover:bg-gray-100"
            } p-1 rounded-full`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`p-4 ${isDark ? "bg-dark-700" : "bg-gray-50"}`}>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <FileText className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Análise de URL:</span>
            </div>

            <div
              className={`p-3 rounded ${
                isDark ? "bg-dark-800" : "bg-white"
              } space-y-2 text-sm`}
            >
              <div className="grid grid-cols-2 gap-2">
                <div>Aparenta ser URL:</div>
                <div
                  className={analysis.isUrl ? "text-green-500" : "text-red-500"}
                >
                  {analysis.isUrl ? "Sim" : "Não"}
                </div>

                <div>Data URL:</div>
                <div
                  className={
                    analysis.isDataUrl ? "text-green-500" : "text-gray-500"
                  }
                >
                  {analysis.isDataUrl ? "Sim" : "Não"}
                </div>

                <div>Blob URL:</div>
                <div
                  className={
                    analysis.isBlobUrl ? "text-green-500" : "text-gray-500"
                  }
                >
                  {analysis.isBlobUrl ? "Sim" : "Não"}
                </div>

                <div>URL externa:</div>
                <div
                  className={
                    analysis.isExternalUrl ? "text-yellow-500" : "text-gray-500"
                  }
                >
                  {analysis.isExternalUrl ? "Sim" : "Não"}
                </div>

                <div>Base64 puro:</div>
                <div
                  className={
                    analysis.isPureBase64 ? "text-yellow-500" : "text-gray-500"
                  }
                >
                  {analysis.isPureBase64 ? "Sim" : "Não"}
                </div>

                <div>Reconhecido como PDF:</div>
                <div
                  className={
                    analysis.recognizedAsPdf ? "text-green-500" : "text-red-500"
                  }
                >
                  {analysis.recognizedAsPdf ? "Sim" : "Não"}
                </div>

                <div>Tamanho:</div>
                <div>{analysis.length} caracteres</div>
              </div>
            </div>

            <div
              className={`mt-3 p-3 rounded ${
                isDark ? "bg-dark-800" : "bg-white"
              }`}
            >
              <div className="text-sm font-medium mb-1">Sugestão:</div>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {getFixSuggestion()}
              </p>
            </div>

            <div className="mt-4">
              <button
                onClick={() => setShowRawData(!showRawData)}
                className={`flex items-center text-sm ${
                  isDark
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-700 hover:text-black"
                }`}
              >
                {showRawData ? (
                  <ChevronUp className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-1" />
                )}
                {showRawData ? "Ocultar URL" : "Mostrar URL"}
              </button>

              {showRawData && (
                <div
                  className={`mt-2 p-3 rounded ${
                    isDark ? "bg-dark-900" : "bg-gray-100"
                  } relative`}
                >
                  <pre className="text-xs overflow-auto max-h-24 whitespace-pre-wrap break-all">
                    {fileUrl}
                  </pre>
                  <button
                    onClick={downloadAsTextFile}
                    className="absolute top-2 right-2 p-1 rounded bg-purple-500 text-white"
                    title="Download URL como arquivo de texto"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {analysis.isDataUrl && (
              <div className="mt-2">
                <button
                  onClick={() => setShowBase64(!showBase64)}
                  className={`flex items-center text-sm ${
                    isDark
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-700 hover:text-black"
                  }`}
                >
                  {showBase64 ? (
                    <ChevronUp className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 mr-1" />
                  )}
                  {showBase64 ? "Ocultar Dados Base64" : "Mostrar Dados Base64"}
                </button>

                {showBase64 && (
                  <div
                    className={`mt-2 p-3 rounded ${
                      isDark ? "bg-dark-900" : "bg-gray-100"
                    }`}
                  >
                    <pre className="text-xs overflow-auto max-h-24 whitespace-pre-wrap break-all">
                      {truncateBase64(fileUrl.split(",")[1] || "")}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 p-4 border-t bg-gray-50 dark:bg-dark-800 border-gray-200 dark:border-dark-700">
          <button
            onClick={() => {
              window.open(fileUrl, "_blank");
            }}
            className="px-3 py-1.5 text-sm flex items-center bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            <Eye className="w-4 h-4 mr-2" />
            Abrir em Nova Aba
          </button>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 text-sm ${
              isDark
                ? "bg-dark-700 hover:bg-dark-600 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            } rounded`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
