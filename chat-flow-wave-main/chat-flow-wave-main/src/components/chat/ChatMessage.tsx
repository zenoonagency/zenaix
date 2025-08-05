import { ChatMessage as ChatMessageType } from '@/hooks/use-chat-storage';
import { cn } from '@/lib/utils';
import { Loader2, User, Volume2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenaixLogo from '@/assets/zenaix-logo.png';

interface ChatMessageProps {
  message: ChatMessageType;
}

const MediaContent = ({ message }: { message: ChatMessageType }) => {
  if (message.type === 'image' && message.mediaUrl) {
    return (
      <div className="relative group">
        <img 
          src={message.mediaUrl} 
          alt="Uploaded image" 
          className="max-w-full h-auto rounded-lg"
          style={{ maxHeight: '200px' }}
        />
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
          onClick={() => window.open(message.mediaUrl, '_blank')}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  if (message.type === 'audio' && message.mediaUrl) {
    return (
      <div className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
        <Volume2 className="h-4 w-4" />
        <audio controls className="flex-1" style={{ height: '32px' }}>
          <source src={message.mediaUrl} type="audio/*" />
          Seu navegador não suporta áudio.
        </audio>
      </div>
    );
  }
  
  return null;
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  
  return (
    <div 
      className={cn(
        "flex w-full mb-6 animate-bounce-in gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center p-1">
          <img src={zenaixLogo} alt="Zenaix Logo" className="w-full h-full object-contain" />
        </div>
      )}
      
        <div 
          className={cn(
            "max-w-[70%] rounded-2xl px-4 py-3 relative",
            isUser 
              ? "bg-chat-bubble-user text-chat-bubble-user-text rounded-br-md shadow-lg" 
              : "bg-gray-100 text-gray-800 rounded-bl-md border border-gray-200"
          )}
      >
        {message.isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm opacity-70">Digitando...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            <MediaContent message={message} />
          </div>
        )}
        
        <div 
          className={cn(
            "text-xs mt-1 opacity-50",
            isUser ? "text-right" : "text-left"
          )}
        >
          {message.timestamp.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-chat-bubble-user flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
};