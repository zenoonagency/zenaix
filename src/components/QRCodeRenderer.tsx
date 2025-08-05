import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeRendererProps {
  qrCodeString: string;
  size?: number;
  className?: string;
}

export function QRCodeRenderer({ qrCodeString, size = 128, className = '' }: QRCodeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!qrCodeString || !canvasRef.current) return;

    const generateQRCode = async () => {
      try {
        await QRCode.toCanvas(canvasRef.current, qrCodeString, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (error) {
        console.error('Erro ao gerar QR code:', error);
      }
    };

    generateQRCode();
  }, [qrCodeString, size]);

  if (!qrCodeString) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded ${className}`} style={{ width: size, height: size }}>
        <span className="text-xs text-gray-500 dark:text-gray-400">QR Code não disponível</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`border border-gray-200 dark:border-gray-600 rounded ${className}`}
      style={{ width: size, height: size }}
    />
  );
} 