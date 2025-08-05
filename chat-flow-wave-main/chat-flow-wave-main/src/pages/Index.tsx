import { ChatWidget } from '@/components/chat/ChatWidget';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Sistema com Chat Assistant</h1>
        <p className="text-xl text-muted-foreground">
          Clique no botão de chat no canto inferior direito para iniciar uma conversa!
        </p>
        <div className="mt-8 space-y-4 max-w-2xl mx-auto text-left">
          <div className="p-6 bg-card border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Funcionalidades do Chat:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Chat com bot inteligente via webhook</li>
              <li>• Mensagens salvas no localStorage</li>
              <li>• Arrastar e mover o chat</li>
              <li>• Minimizar sem fechar</li>
              <li>• Animações suaves</li>
              <li>• Design responsivo</li>
            </ul>
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
};

export default Index;
