import React, { useState, useEffect, useRef } from 'react';
import { Clock, Tag, Send, Users, MessageSquare, Sparkles, Brain, ChevronRight, X, Filter, CheckCircle, Plus, Trash, Upload, FileSpreadsheet, AlertCircle, Phone, Loader, SendHorizonal, User, Moon, Sun, Image, Video, Mic, File } from 'lucide-react';
import { useTagStore, Tag as TagType } from '../../../store/tagStore';
import { Contact, MessageContent, MessageType } from '../types';
import { useThemeStore } from '../../../store/themeStore';
import { generateId } from '../../../utils/generateId';
import { read, utils } from 'xlsx';
import { useToast } from '../../../hooks/useToast';

interface MessageComposerProps {
  onSend: (context: string, messages: MessageContent[], contactIds: string[], manualContacts: Contact[], type: 'ai' | 'standard', delaySeconds: number) => void;
  isSending: boolean;
  progress: number;
  contacts: Contact[];
}

const DEFAULT_DELAY = 30;
const MAX_MESSAGES = 5;

type Mode = 'ai' | 'standard';

export function MessageComposer({ onSend, isSending, progress, contacts }: MessageComposerProps) {
  const [mode, setMode] = useState<Mode>('standard');
  const [context, setContext] = useState('');
  const [messages, setMessages] = useState<MessageContent[]>(
    Array(MAX_MESSAGES).fill({
      type: 'text',
      content: ''
    })
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [delaySeconds, setDelaySeconds] = useState(DEFAULT_DELAY);
  const [activeMessageIndex, setActiveMessageIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado para contatos importados
  const [manualContacts, setManualContacts] = useState<Contact[]>([]);
  const [selectedManualContacts, setSelectedManualContacts] = useState<string[]>([]);
  
  // Refs para importação de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  // Estado para controlar o modal de confirmação para limpar contatos
  const [showClearContactsModal, setShowClearContactsModal] = useState(false);
  
  const { tags } = useTagStore();
  const { theme } = useThemeStore();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  // Objeto com os tipos de mídia aceitos para cada tipo de mensagem
  const mediaTypes = {
    image: 'image/jpeg,image/png,image/gif,image/webp',
    video: 'video/mp4,video/webm,video/ogg',
    audio: 'audio/mpeg,audio/ogg,audio/wav'
  };

  const handleMessageTextChange = (index: number, value: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      newMessages[index] = {
        ...newMessages[index],
        content: value
      };
      return newMessages;
    });
  };

  const handleMessageTypeChange = (index: number, type: MessageType) => {
    setMessages(prev => {
      const newMessages = [...prev];
      // Reset content when changing type
      newMessages[index] = {
        type,
        content: type === 'text' ? (newMessages[index].content || '') : '',
        filename: type !== 'text' ? (newMessages[index].filename || '') : undefined
      };
      return newMessages;
    });
  };

  const handleMediaUpload = (index: number, files: FileList | null, type: MessageType) => {
    if (!files || !files[0]) return;
    
    const file = files[0];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB em bytes
    
    if (file.size > MAX_FILE_SIZE) {
      showToast(`Arquivo muito grande (máximo 10MB). Utilize um arquivo menor.`, 'error');
      console.log(`Arquivo excedeu o limite de tamanho: ${(file.size / (1024 * 1024)).toFixed(2)}MB > 10MB`);
      return;
    }
    
    // Ensure the filename is reasonable length (max 30 chars)
    const filename = file.name.length > 30 
      ? file.name.substring(0, 27) + '...' 
      : file.name;
      
    // Para todos os tipos de mídia, usamos o FileReader
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (!e.target?.result) return;
      
      // Log do tamanho do conteúdo base64
      const content = e.target.result as string;
      const contentSize = content.length;
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const contentSizeMB = (contentSize / 1024 / 1024).toFixed(2);
      
      console.log(`Arquivo ${type}: Tamanho original=${fileSizeMB}MB, Base64=${contentSizeMB}MB`);
      
      // Se o conteúdo for maior que 15MB após a conversão para base64, alerta o usuário
      if (contentSize > 15 * 1024 * 1024) {
        console.warn(`Aviso: Arquivo ${type} muito grande após conversão para base64 (${contentSizeMB}MB)`);
      }
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[index] = {
          type,
          content: content,
          filename: filename
        };
        return newMessages;
      });
    };
    
    reader.readAsDataURL(file);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      return newTags;
    });
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  // Função para lidar com drag and drop de arquivos
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-[#7f00ff]');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-[#7f00ff]');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-[#7f00ff]');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || 
          file.type === 'application/vnd.ms-excel' || 
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // Simular o evento de mudança do input
        const event = {
          target: {
            files: e.dataTransfer.files
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileUpload(event);
      } else {
        setImportError('Formato de arquivo não suportado. Use CSV ou Excel (.xlsx)');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (mode === 'standard' && !messages[0].content.trim()) {
      showToast('Por favor, digite pelo menos uma mensagem', 'error');
      return;
    }
    
    if (mode === 'ai' && !context.trim()) {
      showToast('Por favor, forneça um contexto para a IA', 'error');
      return;
    }
    
    if (selectedManualContacts.length === 0) {
      showToast('Selecione pelo menos um contato para enviar mensagens', 'error');
      return;
    }
    
    // Filtrar apenas os contatos manuais selecionados
    const selectedContactsData = manualContacts.filter(contact => 
      selectedManualContacts.includes(contact.id)
    );
    
    // Log de diagnóstico
    console.log(`Enviando mensagens para ${selectedManualContacts.length} contatos selecionados`);
    console.log('Detalhes dos contatos selecionados:', selectedContactsData.map(c => `${c.name} (${c.phone})`));
    
    // Chamada da função onSend
    onSend(
      context,
      messages.filter(msg => msg.content.trim()),
      selectedManualContacts,
      manualContacts,
      mode,
      delaySeconds
    );
  };

  // Função para limpar todos os contatos
  const handleClearAllContacts = () => {
    if (manualContacts.length === 0) return;
    setShowClearContactsModal(true);
  };
  
  // Função para confirmar a limpeza de todos os contatos
  const confirmClearContacts = () => {
    setManualContacts([]);
    setSelectedManualContacts([]);
    showToast('Todos os contatos foram removidos', 'success');
    setShowClearContactsModal(false);
  };

  // Função otimizada para importar contatos de arquivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      
      // Mostrar feedback de carregamento
      showToast('Processando arquivo...', 'info');
      
      // Read file as array buffer
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Arquivo vazio ou inválido');
      }

      const sheet = workbook.Sheets[sheetName];
      const data = utils.sheet_to_json(sheet) as Record<string, any>[];

      if (data.length === 0) {
        throw new Error('Nenhum dado encontrado no arquivo');
      }

      let importCount = 0;
      const processedContacts = new Set(); // Track duplicates
      const importedContacts: Contact[] = [];
      const skippedCount = { empty: 0, duplicate: 0 };

      // Amostra das primeiras linhas para debug
      console.log('Amostra do arquivo importado:', data.slice(0, 3));

      // Detectar colunas automaticamente
      const firstRow = data[0];
      const columns = Object.keys(firstRow);
      
      console.log('Colunas detectadas:', columns);
      
      // Encontrar colunas para nome e telefone
      const nameField = columns.find(key => 
        key.toLowerCase().replace(/\s+/g, '') === 'nome' || 
        key.toLowerCase().replace(/\s+/g, '') === 'name'
      );
      
      const phoneField = columns.find(key => 
        key.toLowerCase().replace(/\s+/g, '') === 'telefone' || 
        key.toLowerCase().replace(/\s+/g, '') === 'phone'
      );
      
      if (!nameField || !phoneField) {
        throw new Error('Colunas obrigatórias não encontradas. O arquivo deve conter colunas "Nome/Name" e "Telefone/Phone"');
      }
      
      console.log(`Usando colunas: ${nameField} para nome e ${phoneField} para telefone`);

      data.forEach(row => {
        const name = String(row[nameField] || '').trim();
        const phone = String(row[phoneField] || '').replace(/\D/g, '');
        
        // Skip empty or invalid entries
        if (!name || !phone) {
          skippedCount.empty++;
          return;
        }
        
        // Skip duplicates
        const key = `${name}-${phone}`;
        if (processedContacts.has(key)) {
          skippedCount.duplicate++;
          return;
        }
        processedContacts.add(key);

        // Create contact object
        const contactData: Contact = {
          id: generateId(),
          name,
          phone,
          tagIds: [],
        };
        
        // Add to imported contacts array
        importedContacts.push(contactData);
        importCount++;
      });

      if (importCount > 0) {
        // Limpar contatos anteriores e adicionar os novos
        setManualContacts(importedContacts);
        
        // Selecionar automaticamente todos os contatos importados
        const newContactIds = importedContacts.map(contact => contact.id);
        setSelectedManualContacts(newContactIds);
        
        showToast(`${importCount} contatos importados com sucesso!${skippedCount.empty > 0 ? ` (${skippedCount.empty} ignorados por dados incompletos)` : ''}${skippedCount.duplicate > 0 ? ` (${skippedCount.duplicate} duplicados ignorados)` : ''}`, 'success');
      } else {
        showToast('Nenhum contato válido encontrado no arquivo.', 'error');
      }

    } catch (err) {
      console.error('File import error:', err);
      setImportError(
        err instanceof Error 
          ? err.message 
          : 'Erro ao processar arquivo. Verifique o formato e tente novamente.'
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para remover contato manual
  const handleRemoveManualContact = (id: string) => {
    setManualContacts(prev => prev.filter(contact => contact.id !== id));
    setSelectedManualContacts(prev => prev.filter(contactId => contactId !== id));
  };

  // Função para selecionar/desselecionar um contato manual
  const handleSelectManualContact = (id: string) => {
    if (selectedManualContacts.includes(id)) {
      setSelectedManualContacts(prev => prev.filter(contactId => contactId !== id));
    } else {
      setSelectedManualContacts(prev => [...prev, id]);
    }
  };
  
  // Função para selecionar/desselecionar todos os contatos manuais
  const handleSelectAllManualContacts = () => {
    if (selectedManualContacts.length === manualContacts.length) {
      setSelectedManualContacts([]);
    } else {
      setSelectedManualContacts(manualContacts.map(contact => contact.id));
    }
  };

  // Cálculo da variável canSubmit para validar se o formulário pode ser enviado
  const canSubmit = !isSending && 
    selectedManualContacts.length > 0 && 
    ((mode === 'standard' && messages[0].content.trim()) || 
    (mode === 'ai' && context.trim()));

  // Icon mapping for message types
  const messageTypeIcons = {
    text: <MessageSquare className="w-5 h-5" />,
    image: <Image className="w-5 h-5" />,
    video: <Video className="w-5 h-5" />,
    audio: <Mic className="w-5 h-5" />
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (canSubmit) {
        const formattedMessages = mode === 'standard' 
          ? messages.filter(m => m.content.trim())
          : [];
        
        onSend(
          mode === 'ai' ? context : '',
          formattedMessages,
          selectedManualContacts,
          manualContacts.filter(c => selectedManualContacts.includes(c.id)),
          mode,
          delaySeconds
        );
      }
    }} className="space-y-6">
      {/* Mode Selector - Design Aprimorado */}
      <div className={`${isDark ? 'bg-dark-800 border-dark-700' : 'bg-gray-50 border-gray-200'} rounded-xl shadow-md border overflow-hidden`}>
        <div className="flex">
          <button
            type="button"
            onClick={() => setMode('standard')}
            className={`flex-1 py-3 px-4 transition-all flex items-center justify-center gap-3 border-b-2 ${
              mode === 'standard'
                ? `border-[#7f00ff] bg-[#7f00ff]/10 ${isDark ? 'text-white' : 'text-gray-800'}`
                : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-dark-750' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`
            }`}
          >
            <MessageSquare className={`w-5 h-5 ${mode === 'standard' ? 'text-[#7f00ff]' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className="font-medium">Disparo Padrão</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`flex-1 py-3 px-4 transition-all flex items-center justify-center gap-3 border-b-2 ${
              mode === 'ai'
                ? `border-[#7f00ff] bg-[#7f00ff]/10 ${isDark ? 'text-white' : 'text-gray-800'}`
                : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-dark-750' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`
            }`}
          >
            <Brain className={`w-5 h-5 ${mode === 'ai' ? 'text-[#7f00ff]' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className="font-medium">Disparo com IA</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-6">
          {/* Message Composition Section */}
          <div className="space-y-4">
            {mode === 'ai' ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 text-[#7f00ff] mr-2" />
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                    Contexto para IA
                  </label>
                </div>
                <div className="relative">
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={6}
                    className={`w-full px-4 py-3 ${
                      isDark 
                        ? 'bg-dark-700 border-dark-600 text-gray-200 placeholder-gray-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-600'
                    } border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#7f00ff] focus:border-[#7f00ff] resize-none shadow-sm`}
                    placeholder="Descreva o contexto para a IA gerar a mensagem..."
                  />
                  {!context && (
                    <div className={`absolute right-3 top-3 ${
                      isDark ? 'bg-dark-600/60 text-gray-400' : 'bg-gray-200/70 text-gray-600'
                    } text-xs px-2 py-1 rounded flex items-center`}>
                      <Brain className={`w-3 h-3 mr-1 ${isDark ? 'text-gray-400' : 'text-[#7f00ff]/70'}`} />
                      <span className={isDark ? '' : 'font-medium'}>Powered by AI</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-3">
                    <MessageSquare className="w-4 h-4 text-[#7f00ff] mr-2" />
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                      Mensagens
                    </label>
                  </div>
                  
                  {/* Tabs redesenhadas para melhor visual */}
                  <div className={`border-b ${isDark ? 'border-dark-600' : 'border-gray-200'} mb-4`}>
                    <div className="flex overflow-x-auto hide-scrollbar">
                      {messages.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActiveMessageIndex(index)}
                          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                            activeMessageIndex === index
                              ? 'border-[#7f00ff] text-[#7f00ff]'
                              : `border-transparent ${
                                isDark 
                                  ? 'text-gray-400 hover:text-gray-300 hover:border-gray-600' 
                                  : 'text-gray-600 hover:text-gray-800 hover:border-gray-500'
                              }`
                          }`}
                        >
                          Mensagem {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Message Type Selector and Content */}
                <div className="space-y-4">
                  {/* Message Type Selector */}
                  <div className="flex flex-wrap gap-2">
                    {(['text', 'image', 'video', 'audio'] as MessageType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleMessageTypeChange(activeMessageIndex, type)}
                        className={`py-2 px-3 rounded-lg flex items-center gap-2 transition-colors ${
                          messages[activeMessageIndex].type === type
                            ? 'bg-[#7f00ff] text-white'
                            : isDark 
                              ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {messageTypeIcons[type]}
                        <span className="capitalize">{type}</span>
                      </button>
                    ))}
                  </div>

                  {/* Message Content Input */}
                  <div>
                    {messages[activeMessageIndex].type === 'text' ? (
                      <textarea
                        value={messages[activeMessageIndex].content}
                        onChange={(e) => handleMessageTextChange(activeMessageIndex, e.target.value)}
                        rows={4}
                        placeholder="Digite sua mensagem aqui..."
                        className={`w-full px-4 py-3 ${
                          isDark 
                            ? 'bg-dark-700 border-dark-600 text-gray-200 placeholder-gray-500' 
                            : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-600'
                        } border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#7f00ff] focus:border-[#7f00ff] resize-none shadow-sm`}
                      />
                    ) : (
                      <div className="space-y-4">
                        {/* Media Upload Area */}
                        <div 
                          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 ${
                            messages[activeMessageIndex].content 
                              ? 'border-[#7f00ff]' 
                              : isDark 
                                ? 'border-dark-600 hover:border-dark-500' 
                                : 'border-gray-300 hover:border-gray-400'
                          } transition-colors cursor-pointer`}
                          onClick={() => {
                            if (mediaInputRef.current) {
                              mediaInputRef.current.accept = mediaTypes[messages[activeMessageIndex].type as keyof typeof mediaTypes];
                              mediaInputRef.current.click();
                            }
                          }}
                        >
                          {messages[activeMessageIndex].content ? (
                            <div className="w-full">
                              {messages[activeMessageIndex].type === 'image' && (
                                <img 
                                  src={messages[activeMessageIndex].content} 
                                  alt={messages[activeMessageIndex].filename || 'Uploaded image'}
                                  className="max-h-64 mx-auto rounded-lg object-contain"
                                />
                              )}
                              {messages[activeMessageIndex].type === 'video' && (
                                <video 
                                  src={messages[activeMessageIndex].content}
                                  controls
                                  className="max-h-64 w-full rounded-lg"
                                />
                              )}
                              {messages[activeMessageIndex].type === 'audio' && (
                                <audio 
                                  src={messages[activeMessageIndex].content}
                                  controls
                                  className="w-full"
                                />
                              )}
                              <div className="mt-3 flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{messages[activeMessageIndex].filename}</span>
                                <button
                                  type="button"
                                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMessageTypeChange(activeMessageIndex, messages[activeMessageIndex].type);
                                  }}
                                >
                                  <Trash className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="p-3 bg-[#7f00ff]/10 rounded-full mb-3">
                                {messageTypeIcons[messages[activeMessageIndex].type]}
                              </div>
                              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Clique para fazer upload de {
                                  messages[activeMessageIndex].type === 'image' ? 'uma imagem' :
                                  messages[activeMessageIndex].type === 'video' ? 'um vídeo' :
                                  messages[activeMessageIndex].type === 'audio' ? 'um áudio' : ''
                                }
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {
                                  messages[activeMessageIndex].type === 'image' ? 'JPG, PNG, GIF ou WebP' :
                                  messages[activeMessageIndex].type === 'video' ? 'MP4, WebM ou OGG' :
                                  messages[activeMessageIndex].type === 'audio' ? 'MP3, WAV ou OGG' : ''
                                }
                              </p>
                            </>
                          )}
                        </div>

                        {/* Hidden file input */}
                        <input
                          ref={mediaInputRef}
                          type="file"
                          onChange={(e) => handleMediaUpload(activeMessageIndex, e.target.files, messages[activeMessageIndex].type)}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`${isDark ? 'bg-dark-800 border-dark-700' : 'bg-gray-50 border-gray-200'} rounded-xl p-5 border shadow-sm`}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className={`w-5 h-5 text-[#7f00ff]`} />
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                Tempo entre disparos
              </label>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-stretch">
                <div className="relative flex-grow">
                  <input
                    type="number"
                    min="1"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Math.max(1, parseInt(e.target.value) || DEFAULT_DELAY))}
                    className={`w-full sm:w-24 h-full px-4 py-2.5 ${
                      isDark 
                        ? 'bg-dark-700 border-dark-600 text-gray-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-800'
                    } border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#7f00ff] focus:border-[#7f00ff] text-center font-medium`}
                  />
                </div>
                <span className={`inline-flex items-center px-4 py-2.5 ${
                  isDark 
                    ? 'bg-dark-700/80 border-dark-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                } border border-l-0 rounded-r-lg text-sm`}>
                  segundos
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
          {/* Contatos Manuais - Design Aprimorado */}
          <div>
            <div>
              
              {manualContacts.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllManualContacts}
                  className={`text-xs px-3 py-1.5 ${
                    isDark 
                      ? 'bg-dark-700 hover:bg-[#7f00ff]/20 text-[#7f00ff] hover:text-[#7f00ff]' 
                      : 'bg-gray-100 hover:bg-[#7f00ff]/10 text-[#7f00ff] hover:text-[#7f00ff]'
                  } rounded-lg transition-colors font-medium`}
                >
                  {selectedManualContacts.length === manualContacts.length
                    ? 'Desmarcar Todos'
                    : 'Selecionar Todos'}
                </button>
              )}
            </div>
            
            {/* Estatísticas de contatos */}
            {manualContacts.length > 0 && (
              <div className={`flex items-center justify-between px-4 py-2 ${
                isDark 
                  ? 'bg-dark-700/30 border-b border-dark-700' 
                  : 'bg-gray-50 border-b border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-xs">
                    <span className={`mr-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total:</span>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{manualContacts.length}</span>
                  </div>
                  <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-dark-600' : 'bg-gray-300'}`}></div>
                  <div className="flex items-center text-xs">
                    <span className={`mr-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Selecionados:</span>
                    <span className="font-medium text-[#7f00ff]">{selectedManualContacts.length}</span>
                  </div>
                </div>
                
                <div className={`${isDark ? 'bg-dark-700' : 'bg-gray-300'} h-1.5 w-24 rounded-full overflow-hidden`}>
                  <div 
                    className="h-full bg-[#7f00ff]"
                    style={{ width: manualContacts.length > 0 ? `${(selectedManualContacts.length / manualContacts.length) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Seção de importação de arquivo - Design Aprimorado */}
          <div className="p-4">
            <div className={`${isDark ? 'bg-dark-750 border-dark-600/60' : 'bg-gray-50 border-gray-200'} rounded-lg border p-4`}>
              <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3 flex items-center`}>
                <FileSpreadsheet className="w-5 h-5 text-[#7f00ff] mr-2" />
                Importar Contatos
              </h3>
              <div 
                className={`flex flex-col items-center justify-center border border-dashed ${
                  isDark 
                    ? 'border-dark-600 bg-dark-800/50 hover:border-[#7f00ff]' 
                    : 'border-gray-200 bg-white hover:border-[#7f00ff]'
                } rounded-lg p-4 transition-colors`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-[#7f00ff]/60 mb-2" />
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-3 text-center`}>
                  Arraste sua planilha aqui ou
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#7f00ff]/90 text-white font-medium rounded-lg transition-all focus:outline-none hover:bg-[#7f00ff] text-sm shadow-sm hover:shadow-md"
                  style={{ textShadow: isDark ? 'none' : '0px 1px 2px rgba(0,0,0,0.1)' }}
                >
                  Selecionar Arquivo
                </button>
                <div className="mt-3 text-center">
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Formatos: <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>CSV, Excel (.xlsx)</span>
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    Colunas necessárias: <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Nome, Telefone</span>
                  </p>
                </div>
              </div>

              {importError && (
                <div className={`mt-3 p-2.5 ${
                  isDark 
                    ? 'bg-red-900/20 border-red-900/30' 
                    : 'bg-red-50 border-red-200'
                } border text-red-400 rounded-lg flex items-center text-xs`}>
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <p>{importError}</p>
                </div>
              )}
            </div>
            
            {/* Lista de contatos importados - Design Aprimorado */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                  <CheckCircle className="w-4 h-4 text-[#7f00ff] mr-2" />
                  Contatos Importados
                </h3>
                {manualContacts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllContacts}
                    className={`text-xs px-2 py-1 ${
                      isDark 
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300' 
                        : 'bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700'
                    } rounded flex items-center transition-colors shadow-sm`}
                  >
                    <Trash className="w-3 h-3 mr-1" />
                    Limpar todos
                  </button>
                )}
              </div>
              
              <div className={`overflow-y-auto ${isDark ? 'scrollbar-thin' : 'scrollbar scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'} max-h-[240px]`}>
                {manualContacts.length === 0 ? (
                  <div className={`p-4 text-center ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  } text-sm flex flex-col items-center`}>
                    <Users className={`w-10 h-10 ${
                      isDark ? 'text-gray-700/50' : 'text-gray-300'
                    } mb-2`} />
                    <p>Nenhum contato importado</p>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-600' : 'text-gray-500'
                    } mt-1`}>Importe contatos para começar</p>
                  </div>
                ) : (
                  <div className={`divide-y ${
                    isDark ? 'divide-dark-600' : 'divide-gray-100'
                  }`}>
                    {manualContacts.map(contact => (
                      <div 
                        key={contact.id}
                        className={`flex items-center justify-between p-3 ${
                          selectedManualContacts.includes(contact.id)
                            ? `bg-[#7f00ff]/10 border-l-2 border-[#7f00ff]`
                            : isDark ? 'hover:bg-dark-700/30' : 'hover:bg-gray-100/70'
                        } transition-colors`}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedManualContacts.includes(contact.id)}
                            onChange={() => handleSelectManualContact(contact.id)}
                            className={`mr-3 rounded ${
                              isDark 
                                ? 'bg-dark-600 border-dark-500' 
                                : 'bg-gray-300 border-gray-200'
                            } text-[#7f00ff] focus:ring-[#7f00ff]`}
                          />
                          <div>
                            <p className={`text-sm font-medium ${
                              isDark ? 'text-gray-200' : 'text-gray-800'
                            }`}>{contact.name}</p>
                            <p className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>{contact.phone}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveManualContact(contact.id)}
                          className={`${
                            isDark 
                              ? 'text-gray-400 hover:text-red-500 hover:bg-dark-600/50' 
                              : 'text-gray-500 hover:text-red-600 hover:bg-gray-100/80'
                          } transition-colors p-1 rounded`}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer do formulário - Design Aprimorado */}
      <div className={`px-4 py-5 border-t ${
        isDark ? 'border-dark-600 bg-dark-850' : 'border-gray-200 bg-gray-50/80'
      } flex items-center justify-between rounded-b-xl`}>
        <div className="flex items-center space-x-3">
        </div>
        <div className="flex items-center space-x-4">
          {isSending && (
            <div className={`px-3 py-2 ${
              isDark ? 'bg-[#7f00ff]/10 text-[#7f00ff]/90' : 'bg-[#7f00ff]/10 text-[#7f00ff]'
            } rounded-lg text-sm flex items-center shadow-sm`}>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              <span>Enviando: {Math.round(progress * 100)}%</span>
            </div>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`py-2.5 px-5 rounded-lg font-medium flex items-center ${
              canSubmit
                ? 'bg-gradient-to-r from-[#7f00ff] to-[#9500ff] hover:from-[#8a00ff] hover:to-[#a000ff] text-white shadow-md hover:shadow-lg'
                : isDark 
                  ? 'bg-dark-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition-all text-sm`}
            style={{ textShadow: canSubmit && !isDark ? '0px 1px 2px rgba(0,0,0,0.15)' : 'none' }}
          >
            {isSending ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <SendHorizonal className="w-4 h-4 mr-2" />
            )}
            {isSending ? 'Enviando...' : 'Enviar Mensagens'}
          </button>
        </div>
      </div>

      {/* Modal personalizado para confirmar limpeza de contatos */}
      {showClearContactsModal && (
        <div className={`fixed inset-0 ${
          isDark ? 'bg-black/60' : 'bg-gray-800/40'
        } backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 transition-all`}>
          <div className={`${
            isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
          } rounded-xl ${isDark ? 'shadow-2xl' : 'shadow-[0_8px_30px_rgba(0,0,0,0.12)]'} border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300`}>
            <div className={`p-4 border-b ${
              isDark ? 'border-dark-700' : 'border-gray-200'
            } flex items-center`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className={`font-medium ${
                  isDark ? 'text-gray-200' : 'text-gray-800'
                }`}>Remover Contatos</h2>
              </div>
            </div>
            
            <div className="p-6">
              <p className={`${
                isDark ? 'text-gray-300' : 'text-gray-600'
              } mb-6`}>
                Tem certeza que deseja remover todos os contatos da lista?
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearContactsModal(false)}
                  className={`px-4 py-2 ${
                    isDark 
                      ? 'bg-dark-700 hover:bg-dark-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } rounded-lg transition-colors`}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmClearContacts}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}