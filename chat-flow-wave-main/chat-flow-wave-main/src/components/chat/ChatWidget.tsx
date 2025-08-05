import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStorage } from '@/hooks/use-chat-storage';
import { useChatApi } from '@/hooks/use-chat-api';
import { useDrag } from '@/hooks/use-drag';
import { useResize } from '@/hooks/use-resize';
import { useToast } from '@/hooks/use-toast';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { QuickMessages } from './QuickMessages';

type ChatState = 'closed' | 'minimized' | 'open' | 'maximized';

export const ChatWidget = () => {
  const [chatState, setChatState] = useState<ChatState>('closed');
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, addMessage, updateMessage } = useChatStorage();
  console.log('Mensagens no ChatWidget:', messages);
  const { sendMessage, sendMediaMessage, isLoading } = useChatApi();
  const { toast } = useToast();
  
  
  const { position, isDragging, handleMouseDown, resetPosition } = useDrag({
    initialPosition: { x: window.innerWidth * 0.67, y: 0 }, // Posição inicial alinhada à direita
  });

  const { size, isResizing, handleResizeStart, resetSize } = useResize({
    initialSize: { width: window.innerWidth * 0.33, height: window.innerHeight },
    minWidth: 300,
    minHeight: 400,
    maxWidth: window.innerWidth * 0.8,
    maxHeight: window.innerHeight * 0.9
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatState === 'open') {
      scrollToBottom();
    }
  }, [messages, chatState]);

  const handleSendMessage = async (content: string) => {
    let loadingId: string | undefined;
    
    try {
      console.log('Enviando mensagem do usuário:', content);
      
      // Adiciona mensagem do usuário
      const userMessageId = addMessage({ content, sender: 'user' });
      console.log('Mensagem do usuário adicionada com ID:', userMessageId);
      
      // Adiciona mensagem de loading do bot
      loadingId = addMessage({ 
        content: '', 
        sender: 'bot',
        isLoading: true 
      });
      console.log('Mensagens de loading adicionada com ID:', loadingId);

      // Envia mensagem para API
      const botResponse = await sendMessage(content);
      console.log('Resposta da API recebida:', botResponse);
      
      // Atualiza mensagem do bot com a resposta
      updateMessage(loadingId, { 
        content: botResponse, 
        isLoading: false 
      });
      console.log('Mensagem do bot atualizada');

      if (chatState === 'minimized' || chatState === 'closed') {
        setHasNewMessage(true);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Remove mensagem de loading em caso de erro
      if (loadingId) {
        updateMessage(loadingId, { 
          content: `Erro: ${errorMessage}`, 
          isLoading: false 
        });
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSendMedia = async (content: string, type: 'image' | 'audio' | 'document', file: File) => {
    let loadingId: string | undefined;
    
    try {
      // Converte o arquivo para base64 para persistência
      const mediaUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      // Adiciona mensagem do usuário com mídia
      const userMessageId = addMessage({ 
        content, 
        sender: 'user',
        type,
        mediaUrl,
        fileName: file.name
      });

      // Adiciona mensagem de loading do bot
      loadingId = addMessage({ 
        content: '', 
        sender: 'bot',
        isLoading: true 
      });

      // Envia arquivo para API
      const botResponse = await sendMediaMessage(file, file.name, type);
      
      // Atualiza mensagem do bot com a resposta
      updateMessage(loadingId, { 
        content: botResponse, 
        isLoading: false 
      });

      if (chatState === 'minimized' || chatState === 'closed') {
        setHasNewMessage(true);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Remove mensagem de loading em caso de erro
      if (loadingId) {
        updateMessage(loadingId, { 
          content: `Erro: ${errorMessage}`, 
          isLoading: false 
        });
      }

      toast({
        title: "Erro ao enviar arquivo",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleOpenChat = () => {
    setChatState('open');
    setHasNewMessage(false);
  };

  const handleMinimizeChat = () => {
    setChatState('minimized');
  };

  const handleMaximizeChat = () => {
    setChatState('maximized');
  };

  const handleRestoreChat = () => {
    setChatState('open');
  };

  const handleCloseChat = () => {
    setChatState('closed');
    resetPosition();
    resetSize();
  };

  const isVisible = chatState !== 'closed';
  const isOpen = chatState === 'open' || chatState === 'maximized';
  const isMaximized = chatState === 'maximized';

  return (
    <>
      {/* Chat Button */}
      {!isVisible && (
        <Button
          onClick={handleOpenChat}
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg",
            "bg-chat-primary hover:bg-chat-primary-hover",
            "z-50 animate-bounce-in"
          )}
        >
          <MessageCircle className="h-6 w-6 text-white" />
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full animate-pulse-ring" />
          )}
        </Button>
      )}

      {/* Minimized Chat - positioned at top */}
      {chatState === 'minimized' && (
        <div
          className={cn(
            "fixed z-50 top-4 right-4",
            "animate-slide-up"
          )}
        >
          <Button
            onClick={handleOpenChat}
            className={cn(
              "h-12 px-4 rounded-lg shadow-lg bg-chat-primary hover:bg-chat-primary-hover",
              "flex items-center gap-2 text-white relative"
            )}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Chat Minimizado</span>
            {hasNewMessage && (
              <div className="h-2 w-2 bg-white rounded-full animate-pulse ml-2" />
            )}
            {/* Minimize indicator */}
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full flex items-center justify-center">
              <Minus className="h-2 w-2 text-white" />
            </div>
          </Button>
        </div>
      )}

      {/* Full Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-chat-background border-chat-border border shadow-2xl",
            "flex flex-col overflow-hidden",
            isMaximized 
              ? "top-0 left-0 w-full h-full rounded-none animate-slide-in-right" 
              : "rounded-l-2xl animate-slide-in-right"
          )}
          style={!isMaximized ? {
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
          } : {}}
        >
          <ChatHeader
            onClose={handleCloseChat}
            onMinimize={handleMinimizeChat}
            onMaximize={handleMaximizeChat}
            onRestore={handleRestoreChat}
            onMouseDown={handleMouseDown}
            isDragging={isDragging}
            isMaximized={isMaximized}
          />
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Inicie uma conversa!</p>
                  <p className="text-xs mt-2 opacity-70">
                    Use as mensagens rápidas abaixo ou digite sua própria pergunta.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {console.log('Renderizando', messages.length, 'mensagens')}
                {messages.map((message, index) => {
                  console.log('Renderizando mensagem', index, message);
                  return <ChatMessage key={message.id} message={message} />
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Quick Messages */}
          <QuickMessages
            onSend={handleSendMessage}
            disabled={isLoading}
          />
          
          <ChatInput
            onSend={handleSendMessage}
            onSendMedia={handleSendMedia}
            disabled={isLoading}
            placeholder="Digite sua mensagem..."
          />

          {/* Resize Handles */}
          {!isMaximized && (
            <>
              {/* Right resize handle */}
              <div
                className="absolute top-0 right-0 w-1 h-full cursor-ew-resize bg-transparent hover:bg-chat-border/50 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, 'right')}
              />
              
              {/* Bottom resize handle */}
              <div
                className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize bg-transparent hover:bg-chat-border/50 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, 'bottom')}
              />
              
              {/* Corner resize handle */}
              <div
                className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize bg-chat-border/30 hover:bg-chat-border/70 transition-colors"
                onMouseDown={(e) => handleResizeStart(e, 'corner')}
              />
            </>
          )}
        </div>
      )}
    </>
  );
};