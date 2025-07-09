import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Tag as TagIcon, UserPlus, Send, CheckSquare, Bug } from 'lucide-react';
import { useContactsStore } from '../store/contactsStore';
import { useTagStore } from '../../../store/tagStore';
import { useMessagingStore } from '../../Messaging/store/messagingStore';
import { Contact } from '../types';
import { TagFilter } from './TagFilter';
import { ContactDetailModal } from './ContactDetailModal';
import { useCustomModal } from '../../../components/CustomModal';
import { useToast } from '../../../hooks/useToast';

interface ContactListProps {
  onEdit: (contact: Contact) => void;
  onAddToKanban: (contactIds: string[]) => void;
  onAddToMessaging: (contactIds: string[]) => void;
}

export function ContactList({ onEdit, onAddToKanban, onAddToMessaging }: ContactListProps) {
  const { 
    contacts = [], 
    selectedContacts = [], 
    selectedTags = [],
    toggleContactSelection, 
    selectAllContacts, 
    clearSelection, 
    deleteContact,
    setSelectedTags,
    addContact
  } = useContactsStore() || {};
  const { tags = [] } = useTagStore() || {};
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { modal, customConfirm } = useCustomModal();
  const { showToast } = useToast();

  // Garantir que contacts seja um array mesmo se vier undefined
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const safeSelectedContacts = Array.isArray(selectedContacts) ? selectedContacts : [];
  const safeSelectedTags = Array.isArray(selectedTags) ? selectedTags : [];
  const safeTags = Array.isArray(tags) ? tags : [];

  const filteredContacts = safeContacts.filter(contact => {
    // Se o contato não existir, ignorá-lo
    if (!contact) return false;
    
    if (safeSelectedTags.length === 0) return true;
    return contact.tagIds && Array.isArray(contact.tagIds) && contact.tagIds.some(tagId => safeSelectedTags.includes(tagId));
  });

  const handleSelectAll = () => {
    if (safeSelectedContacts.length === filteredContacts.length) {
      clearSelection && clearSelection();
    } else {
      selectAllContacts && selectAllContacts(filteredContacts.map(c => c.id));
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await customConfirm(
      'Excluir contato',
      'Tem certeza que deseja excluir este contato?'
    );
    
    if (confirmed) {
      try {
        deleteContact && deleteContact(id);
        showToast('Contato excluído com sucesso!', 'success');
      } catch (error) {
        showToast('Erro ao excluir contato', 'error');
      }
    }
  };

  // Função para criar contatos de teste
  const handleCreateTestContacts = async () => {
    const confirmed = await customConfirm(
      'Criar contatos de teste',
      'Deseja criar alguns contatos de teste para diagnóstico? Isso ajudará a identificar problemas no sistema.'
    );
    
    if (confirmed && addContact) {
      try {
        const testContacts = [
          { 
            name: 'João Silva', 
            phone: '11987654321', 
            tagIds: safeTags.length > 0 ? [safeTags[0].id] : [],
            customFields: {}
          },
          { 
            name: 'Maria Oliveira', 
            phone: '21987654321', 
            tagIds: safeTags.length > 1 ? [safeTags[0].id, safeTags[1].id] : 
                   safeTags.length > 0 ? [safeTags[0].id] : [],
            customFields: {}
          }
        ];
        
        testContacts.forEach(contact => addContact(contact));
        showToast('Contatos de teste criados com sucesso!', 'success');
      } catch (error) {
        showToast('Erro ao criar contatos de teste', 'error');
      }
    }
  };

  const handleAddToMessaging = async (contactIds: string[]) => {
    // Log para diagnóstico
    console.log('ContactList - Enviando contatos para mensagens:', contactIds);
    
    // Verificar se os contatos existem
    const contactsToSend = safeContacts.filter(c => contactIds.includes(c.id));
    console.log('ContactList - Detalhes dos contatos selecionados:', 
      contactsToSend.map(c => `${c.name} (${c.phone})`));
    
    try {
      // Aplicar os contatos selecionados à store de mensagens
      useMessagingStore.getState().setSelectedContacts(contactIds);
      
      // Chamar a função recebida por props
      onAddToMessaging(contactIds);
    } catch (error) {
      console.error('Erro ao enviar contatos para mensagens:', error);
      showToast('Erro ao adicionar contatos à lista de disparo', 'error');
    }
  };

  // Logs de diagnóstico
  useEffect(() => {
    console.log("ContactList - Contatos carregados:", safeContacts.length);
    console.log("ContactList - Tags carregadas:", safeTags.length);
    console.log("ContactList - Tags selecionadas:", safeSelectedTags.length);
    
    if (safeContacts.length > 0) {
      console.log("ContactList - Amostra de contatos:", safeContacts.slice(0, 3).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        tagIds: c.tagIds || []
      })));
    }
  }, [safeContacts.length, safeTags.length, safeSelectedTags.length, safeContacts]);

  // Renderiza um fallback para quando não há contatos
  const renderEmptyState = () => (
    <div className="text-center py-10 flex flex-col items-center">
      <h3 className="text-gray-500 dark:text-gray-400 mb-3">Nenhum contato encontrado</h3>
      <p className="text-gray-400 dark:text-gray-500 mb-4 max-w-md">
        Você ainda não possui contatos cadastrados ou nenhum contato corresponde aos filtros aplicados.
      </p>
      <button
        onClick={handleCreateTestContacts}
        className="flex items-center px-4 py-2 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
      >
        <Bug className="w-4 h-4 mr-2" />
        Criar contatos de teste
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <TagFilter selectedTags={safeSelectedTags} onChange={setSelectedTags} />
      
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
              disabled={filteredContacts.length === 0}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              {safeSelectedContacts.length === filteredContacts.length && filteredContacts.length > 0
                ? 'Desmarcar Todos'
                : 'Selecionar Todos'}
            </button>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Contatos ({filteredContacts.length})
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {safeSelectedContacts.length > 0 && (
              <>
                <button
                  onClick={() => onAddToKanban(safeSelectedContacts)}
                  className="flex items-center px-4 py-2 text-sm bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar ao Kanban
                </button>
                <button
                  onClick={() => handleAddToMessaging(safeSelectedContacts)}
                  className="flex items-center px-4 py-2 text-sm bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Lista de Disparo ({safeSelectedContacts.length})
                </button>
              </>
            )}
            {filteredContacts.length === 0 && (
              <button
                onClick={handleCreateTestContacts}
                className="flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
              >
                <Bug className="w-4 h-4 mr-2" />
                Criar contatos teste
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredContacts.length === 0 ? (
            renderEmptyState()
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="w-16 px-6 py-3">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={safeSelectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                        onChange={handleSelectAll}
                        className="w-5 h-5 rounded text-[#7f00ff] focus:ring-[#7f00ff] cursor-pointer"
                      />
                    </div>
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider px-6 py-3">
                    Nome
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider px-6 py-3">
                    Telefone
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider px-6 py-3">
                    Tags
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider px-6 py-3">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={safeSelectedContacts.includes(contact.id)}
                          onChange={() => toggleContactSelection && toggleContactSelection(contact.id)}
                          className="w-5 h-5 rounded text-[#7f00ff] focus:ring-[#7f00ff] cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {contact.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {contact.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tagIds && Array.isArray(contact.tagIds) && contact.tagIds.length > 0 ? (
                          contact.tagIds.map((tagId) => {
                            if (!tagId) return null;
                            const tag = safeTags.find((t) => t && t.id === tagId);
                            return tag ? (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${tag.color}20`,
                                  color: tag.color,
                                  border: `1px solid ${tag.color}`,
                                }}
                              >
                                {tag.name}
                              </span>
                            ) : (
                              <span
                                key={tagId}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                Tag {tagId.substring(0, 4)}...
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Sem tags
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(contact);
                        }}
                        className="text-[#7f00ff] hover:text-[#7f00ff]/80 mr-3"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
      {modal}
    </div>
  );
}