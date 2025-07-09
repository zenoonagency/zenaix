import { Dialog } from '@headlessui/react';
import { Calendar } from 'lucide-react';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function IntegrationModal({ isOpen, onClose, onConfirm }: IntegrationModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center">
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

        <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Fechar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <Dialog.Title className="text-xl font-semibold">
              Integração
            </Dialog.Title>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
              alt="Google Calendar"
              className="w-12 h-12"
            />
            <span className="text-lg">Google calendar</span>
          </div>

          <div className="space-y-4 text-gray-600 mb-8">
            <p>
              O processo de sincronia ou dessincronia pode demorar um pouco, 
              fique à vontade para navegar no sistema enquanto trabalhamos nisso.
            </p>
            <p>
              Após a conclusão da sincronização, todos os eventos em que você é 
              consultor ou participante serão adicionados à sua agenda. Além disso, 
              novos eventos também serão automaticamente incluídos.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Iniciar integração
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 