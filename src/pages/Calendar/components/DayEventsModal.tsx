import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: any[];
  onEventClick?: (event: any) => void;
}

export function DayEventsModal({ isOpen, onClose, date, events, onEventClick }: DayEventsModalProps) {
  if (!isOpen) return null;

  const formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-md transform transition-all">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {formattedDate}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {events.length} evento{events.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Lista de eventos */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400">Nenhum evento neste dia</p>
                  ) : (
                    <div className="space-y-3">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer transition-all"
                        >
                          <div className="flex items-start gap-3">
                            {/* Horário */}
                            <div className="flex-shrink-0 text-sm text-gray-400">
                              {format(new Date(event.start), 'HH:mm')}
                            </div>
                            
                            {/* Detalhes */}
                            <div className="flex-grow">
                              <h4 className="text-white font-medium mb-1">
                                {event.title}
                              </h4>
                              {event.description && (
                                <p className="text-sm text-gray-400 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                              {event.categories?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {event.categories.map((category: string) => (
                                    <span
                                      key={category}
                                      className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300"
                                    >
                                      {category}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 