import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Image, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSend: (message: string) => void;
  onSendMedia: (content: string, type: 'image' | 'audio' | 'document', file: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ 
  onSend, 
  onSendMedia,
  disabled = false, 
  placeholder = "Digite sua mensagem..." 
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive"
      });
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isDocument = file.type.startsWith('application/') || 
                      file.type.includes('pdf') || 
                      file.type.includes('doc') || 
                      file.type.includes('text/');
    
    if (!isImage && !isAudio && !isDocument) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Apenas imagens, áudios e documentos são aceitos",
        variant: "destructive"
      });
      return;
    }

    const type = isImage ? 'image' : isAudio ? 'audio' : 'document';
    onSendMedia(file.name, type, file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Envia o áudio como mensagem
        onSendMedia(`Áudio gravado`, 'audio', audioFile);
        
        // Para todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);

      toast({
        title: "Gravação iniciada",
        description: "Fale agora. Clique novamente para parar.",
      });

    } catch (error) {
      toast({
        title: "Erro ao acessar microfone",
        description: "Permita o acesso ao microfone para gravar áudio",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);

      toast({
        title: "Gravação finalizada",
        description: "Áudio enviado com sucesso",
      });
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="p-4 border-t bg-chat-surface">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="h-10 w-10 p-0 hover:bg-chat-border"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleRecording}
            disabled={disabled}
            className={cn(
              "h-10 w-10 p-0 hover:bg-chat-border",
              isRecording && "bg-red-500 hover:bg-red-600 text-white animate-pulse"
            )}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,application/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-h-[40px] bg-white border-gray-300 text-black placeholder:text-gray-500"
          autoComplete="off"
        />
        
        <Button
          type="submit"
          disabled={disabled || !message.trim()}
          size="default"
          className={cn(
            "px-3 bg-chat-primary hover:bg-chat-primary-hover text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};