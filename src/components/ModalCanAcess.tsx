import { MessageCircle } from "lucide-react";

interface ModalCanAcess {
  title: string;
  description?: string;
}

export const ModalCanAcess = ({ title, description }: ModalCanAcess) => {
  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-700 text-transparent bg-clip-text">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <MessageCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Acesso Negado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            Você não tem permissão para acessar esta página. Entre em contato
            com o administrador da organização.
          </p>
        </div>
      </div>
    </div>
  );
};
