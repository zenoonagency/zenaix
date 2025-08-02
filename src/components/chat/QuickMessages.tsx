import { Button } from "../../components/ui/button";
import { MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface QuickMessageProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const quickMessages = [
  {
    id: "resumo-executivo",
    title: "Resumo executivo",
    description:
      "Escolha entre mais de 35 ferramentas de geração de relatórios",
    message: "gerar um resumo executivo",
    badge: "Novo",
  },
  {
    id: "atualizacao-projeto",
    title: "Atualização do projeto",
    description: "Atualização do status do projeto com base no tempo",
    message: "atualização do projeto",
    badge: "Novo",
  },
  {
    id: "tarefas-duplicadas",
    title: "Encontre tarefas duplicadas",
    description: "Identifica e mescla tarefas duplicadas gratuitamente",
    message: "encontrar tarefas duplicadas",
    badge: "Novo",
  },
  {
    id: "tarefas-travadas",
    title: "Encontre tarefas que estão travadas",
    description: "Localiza e resolve rapidamente tarefas estagnadas",
    message: "encontrar tarefas travadas",
    badge: "Novo",
  },
];

export const QuickMessages = ({ onSend, disabled }: QuickMessageProps) => {
  // Não renderiza se estiver disabled (IA digitando)
  if (disabled) {
    return null;
  }

  return (
    <div className="px-3 pb-3 bg-transparent">
      <div className="space-y-2">
        {quickMessages.map((quickMsg, index) => {
          return (
            <Button
              key={quickMsg.id}
              variant="ghost"
              onClick={() => onSend(quickMsg.message)}
              disabled={disabled}
              className={cn(
                "w-full justify-between h-auto p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg",
                "transition-all duration-200 group"
              )}
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="relative w-6 h-6 flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <h4 className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                    {quickMsg.title}
                  </h4>
                  <span className="px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded dark:bg-blue-900/20 dark:text-blue-300">
                    {quickMsg.badge}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-3 w-3 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};
