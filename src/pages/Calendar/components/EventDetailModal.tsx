import React from 'react';
import { X, Calendar, Clock, User, Tag, Info, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Modal } from '../../../components/Modal';
import { useCalendarStore } from '../../../store/calendarStore';
import { useTeamStore } from '../../../pages/Team/store/teamStore';
import { toast } from 'react-hot-toast';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onEdit?: (event: any) => void;
}

export function EventDetailModal({ isOpen, onClose, event, onEdit }: EventDetailModalProps) {
  const { deleteEvent } = useCalendarStore();
  const { members } = useTeamStore();
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  
  if (!event) return null;

  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  const formatTime = (date: Date) => {
    return format(date, "HH:mm", { locale: ptBR });
  };

  // Encontrar o nome do responsável pelo ID
  const getResponsibleName = (id: string) => {
    const member = members.find(member => member.id === id);
    return member ? member.name : id;
  };

  const handleEdit = () => {
    onClose();
    if (onEdit) {
      onEdit(event);
    }
  };

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    deleteEvent(event.id);
    toast.success(`Evento "${event.title}" excluído com sucesso!`);
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Evento">
        <div className="space-y-6">
          {/* Título */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {event.title}
          </h2>
          
          {/* Data e hora */}
          <div className="space-y-4">
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-[#7f00ff] mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(startDate)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-[#7f00ff] mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Horário
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatTime(startDate)} - {formatTime(endDate)}
                </p>
              </div>
            </div>
            
            {event.responsible && (
              <div className="flex items-start">
                <User className="w-5 h-5 text-[#7f00ff] mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Responsável
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getResponsibleName(event.responsible)}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Descrição */}
          {event.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Descrição
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}
          
          {/* Categorias */}
          {event.categories && event.categories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Tag className="w-4 h-4 mr-1" />
                Categorias
              </h4>
              <div className="flex flex-wrap gap-2">
                {event.categories.map((category: string) => (
                  <span
                    key={category}
                    className="px-2 py-0.5 text-xs rounded-full bg-[#7f00ff]/10 text-[#7f00ff]"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Campos personalizados */}
          {event.customFields && event.customFields.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campos Personalizados
              </h4>
              <div className="space-y-2">
                {event.customFields.map((field: any) => (
                  <div key={field.id} className="flex">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                      {field.name}:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Botões de ação */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Trash2 size={16} className="mr-2" />
              Excluir
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Pencil size={16} className="mr-2" />
              Editar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal 
        isOpen={showConfirmDelete} 
        onClose={() => setShowConfirmDelete(false)}
        title="Confirmar exclusão"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Tem certeza que deseja excluir o evento "{event?.title}"?
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 focus:outline-none"
            onClick={() => setShowConfirmDelete(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
            onClick={confirmDelete}
          >
            Excluir
          </button>
        </div>
      </Modal>
    </>
  );
} 