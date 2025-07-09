import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, AlertCircle, Clock, Trash2, MessageSquare, History, X, Image, Video, Mic, File, Users } from 'lucide-react';
import { MessageBatch, MessageType } from '../types';
import { useMessagingStore } from '../store/messagingStore';
import { useToast } from '../../../hooks/useToast';
import { useThemeStore } from '../../../store/themeStore';

export function MessageHistory({ batches }: { batches: MessageBatch[] }) {
  const { removeBatch } = useMessagingStore();
  const { showToast } = useToast();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);

  const handleDelete = (id: string) => {
    removeBatch(id);
    showToast('Disparo removido do histórico', 'success');
  };

  const handleDeleteAll = () => {
    // Mostrar o modal de confirmação personalizado
    setShowClearHistoryModal(true);
  };
  
  // Função para confirmar a limpeza de todo o histórico
  const confirmClearHistory = () => {
    batches.forEach(batch => removeBatch(batch.id));
    showToast('Histórico de disparos foi limpo', 'success');
    setShowClearHistoryModal(false);
  };
  
  const getStatusClass = (status: MessageBatch['status']) => {
    switch (status) {
      case 'completed':
        return isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700';
      case 'failed':
        return isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700';
      default:
        return isDark ? 'bg-[#7f00ff]/20 text-[#7f00ff]' : 'bg-purple-100 text-purple-700';
    }
  };
  
  const getStatusText = (status: MessageBatch['status']) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'failed':
        return 'Falhou';
      case 'in_progress':
        return 'Em progresso';
      default:
        return 'Pendente';
    }
  };
  
  const getStatusIcon = (status: MessageBatch['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3" />;
      case 'in_progress':
        return <Clock className="w-3 h-3 animate-pulse" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  // Get icon for message type
  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case 'image':
        return <Image className="w-3 h-3" />;
      case 'video':
        return <Video className="w-3 h-3" />;
      case 'audio':
        return <Mic className="w-3 h-3" />;
      case 'document':
        return <File className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  if (!batches || batches.length === 0) {
    return (
      <div className={`p-6 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <div className="flex flex-col items-center justify-center">
          <History className={`w-12 h-12 ${isDark ? 'text-gray-700' : 'text-gray-300'} mb-3`} />
          <p className="text-sm">Nenhum histórico de envio encontrado</p>
          <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'} mt-1`}>Os envios realizados aparecerão aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={`px-4 py-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'} flex justify-between items-center`}>
        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {batches.length} {batches.length === 1 ? 'disparo' : 'disparos'} no histórico
        </div>
        <button
          onClick={handleDeleteAll}
          className={`text-xs ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'} flex items-center gap-1`}
        >
          <Trash2 className="w-3 h-3" />
          Limpar histórico
        </button>
      </div>

      <div className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
        {batches.map((batch) => (
          <div 
            key={batch.id} 
            className={`p-4 transition-colors ${
              isDark ? 'hover:bg-dark-750/50' : 'hover:bg-gray-100/70'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                    {format(new Date(batch.createdAt), "d MMM yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    {format(new Date(batch.createdAt), "HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                
                <div className={`mt-3 ${
                  isDark 
                    ? 'bg-dark-750 border border-dark-600' 
                    : 'bg-gray-50 border border-gray-200'
                } rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                      <Users className="w-3.5 h-3.5" />
                      <span>{batch.contacts.length} contato{batch.contacts.length !== 1 ? 's' : ''}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusClass(batch.status)}`}>
                      {getStatusIcon(batch.status)}
                      <span>{getStatusText(batch.status)}</span>
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <MessageSquare className="w-3 h-3" />
                        <span>{batch.messages.length} tipo{batch.messages.length !== 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className={`flex items-center gap-1 text-xs ${
                        batch.sentCount > 0 
                          ? (isDark ? 'text-green-400' : 'text-green-600') 
                          : (isDark ? 'text-gray-400' : 'text-gray-600')
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                        <span>{batch.sentCount} enviada{batch.sentCount !== 1 ? 's' : ''}</span>
                      </div>
                      
                      {batch.failedCount > 0 && (
                        <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                          <AlertCircle className="w-3 h-3" />
                          <span>{batch.failedCount} falha{batch.failedCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleDelete(batch.id)}
                      className={`p-1.5 ${
                        isDark 
                          ? 'text-gray-500 hover:text-red-400 hover:bg-dark-700' 
                          : 'text-gray-500 hover:text-red-500 hover:bg-gray-200'
                      } rounded-full transition-colors`}
                      title="Excluir disparo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {batch.status === 'in_progress' && (
              <div className="mt-2">
                <div className={`w-full ${isDark ? 'bg-dark-700' : 'bg-gray-200'} rounded-full h-1.5 overflow-hidden`}>
                  <div
                    className="bg-[#7f00ff] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${batch.progress}%` }}
                  />
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mt-1 text-right`}>
                  {Math.round(batch.progress)}%
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal personalizado para confirmar limpeza do histórico */}
      {showClearHistoryModal && (
        <div className={`fixed inset-0 ${
          isDark ? 'bg-black/60' : 'bg-gray-800/40'
        } backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 transition-all`}>
          <div className={`${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          } rounded-xl ${isDark ? 'shadow-2xl' : 'shadow-[0_8px_30px_rgba(0,0,0,0.12)]'} border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300`}>
            <div className={`p-4 border-b ${
              isDark ? 'border-dark-700' : 'border-gray-200'
            } flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className={`font-medium ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}>Limpar Histórico</h2>
              </div>
              <button 
                onClick={() => setShowClearHistoryModal(false)}
                className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6 text-sm`}>
                Tem certeza que deseja limpar todo o histórico de envios? Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearHistoryModal(false)}
                  className={`px-4 py-2 rounded-lg ${
                    isDark 
                      ? 'text-gray-300 hover:bg-dark-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  } transition-colors`}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmClearHistory}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Limpar Histórico
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}