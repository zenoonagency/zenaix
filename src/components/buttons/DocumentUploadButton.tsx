import React, { useState, useRef } from 'react';
import { Upload, Trash2, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface DocumentUploadButtonProps {
  webhook?: string;
}

export function DocumentUploadButton({ webhook }: DocumentUploadButtonProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      (file.type === 'application/pdf' || file.type === 'text/plain') &&
      selectedFiles.length + files.length <= 3
    );
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 3));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!webhook || selectedFiles.length === 0) {
      showToast('Configure o webhook de arquivo nas configurações', 'error');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append(`file${index + 1}`, file);
      });

      const response = await fetch(webhook, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar arquivos');
      }

      showToast('Arquivos enviados com sucesso!', 'success');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Erro ao enviar arquivos:', error);
      showToast('Erro ao enviar arquivos', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full p-[1px]">
      <div className="relative h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7f00ff] to-[#e100ff] rounded-lg opacity-50" />
        <div className="relative bg-white dark:bg-dark-900 rounded-lg p-6 h-full flex flex-col">
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-[#7f00ff]" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Upload de Documentos</h3>
            </div>
          </div>
          
          <div className={`flex-1 flex flex-col justify-center ${selectedFiles.length > 0 ? 'min-h-[200px]' : 'min-h-[150px]'} transition-all duration-300`}>
            <div className="space-y-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-dark-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-[#7f00ff]/10 p-2 rounded-lg">
                      <Upload className="w-5 h-5 text-[#7f00ff]" />
                    </div>
                    <span className="text-base text-gray-700 dark:text-white truncate">
                      {file.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-4 text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {selectedFiles.length === 0 && (
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7f00ff] to-[#e100ff] rounded-lg opacity-25 group-hover:opacity-50 transition-opacity" />
                  <div className="relative bg-gray-50 dark:bg-dark-800/50 rounded-lg p-8">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <Upload className="w-12 h-12 mb-4 opacity-50 group-hover:opacity-75 transition-opacity" />
                      <p className="text-sm text-center">
                        Arraste um arquivo aqui ou <span className="text-[#7f00ff]">clique para selecionar</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 px-4 py-3 bg-gray-50 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors flex items-center justify-center gap-2 ${selectedFiles.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={selectedFiles.length >= 3}
              >
                <Upload className="w-5 h-5" />
                Selecionar Arquivo
              </button>
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleUpload}
                  disabled={!webhook || isUploading}
                  className="px-6 py-3 bg-gradient-to-r from-[#7f00ff] to-[#e100ff] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Enviar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Formatos aceitos: PDF, TXT. Máximo de 3 arquivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}