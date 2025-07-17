import React, { useState, useRef, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { Download, ExternalLink } from "lucide-react";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
  height?: string;
  className?: string;
}

export function PDFViewer({
  fileUrl,
  fileName = "documento.pdf",
  height = "600px",
  className = "",
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(700);

  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 32); // padding
      }
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err: any) {
    setError("Erro ao carregar PDF");
    setLoading(false);
  }

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const handleOpenExternal = () => {
    window.open(fileUrl, "_blank");
  };

  // Altura da barra de botões (em px)
  const toolbarHeight = 48;

  return (
    <div
      ref={containerRef}
      className={`relative border border-gray-200 dark:border-dark-700 rounded-lg overflow-hidden flex flex-col ${className}`}
      style={{ height }}
    >
      <div
        className="flex gap-2 p-2 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700"
        style={{ height: toolbarHeight, flex: "0 0 auto", zIndex: 2 }}
      >
        <button
          onClick={handleDownload}
          className="p-1.5 rounded bg-white dark:bg-dark-800 shadow-sm hover:bg-gray-100 dark:hover:bg-dark-700 text-[#7f00ff]"
          title="Download PDF"
        >
          <Download size={16} />
        </button>
        <button
          onClick={handleOpenExternal}
          className="p-1.5 rounded bg-white dark:bg-dark-800 shadow-sm hover:bg-gray-100 dark:hover:bg-dark-700 text-blue-500"
          title="Abrir em nova aba"
        >
          <ExternalLink size={16} />
        </button>
      </div>
      <div
        className="flex flex-col items-center justify-center w-full bg-gray-50 dark:bg-dark-900 relative"
        style={{
          flex: "1 1 0%",
          minHeight: 0,
          paddingTop: 0,
          height: `calc(100% - ${toolbarHeight}px)`,
          overflow: "auto",
        }}
      >
        {loading && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Carregando PDF...
          </p>
        )}
        {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
        <Document
          className="absolute top-0"
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          error=""
        >
          {Array.from(new Array(numPages || 0), (el, index) => (
            <div
              key={`page_${index + 1}`}
              style={index === 0 ? { marginTop: 8 } : {}}
            >
              <Page pageNumber={index + 1} width={containerWidth} />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
