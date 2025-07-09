import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ContactList } from './components/ContactList';
import { ContactModal } from './components/ContactModal';
import { ContactImporter } from './components/ContactImporter';
import { useContactsStore } from './store/contactsStore';
import { useClientsStore } from '../Clients/store/clientsStore';
import { useMessagingStore } from '../Messaging/store/messagingStore';
import { Contact } from './types';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';

export function Contacts() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { addContact, updateContact } = useContactsStore();
  const { lists, addClient } = useClientsStore();
  const { setSelectedContacts } = useMessagingStore();
  const { showToast } = useToast();

  // Log quando o componente é montado
  useEffect(() => {
    console.log("Contacts page - Component mounted");
  }, []);

  const handleAddContact = (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    addContact(contactData);
    setShowModal(false);
    showToast('Contato adicionado com sucesso!', 'success');
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const handleUpdateContact = (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingContact) {
      updateContact(editingContact.id, contactData);
      setEditingContact(null);
      setShowModal(false);
      showToast('Contato atualizado com sucesso!', 'success');
    }
  };

  const handleImportContacts = (contacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    contacts.forEach(contact => addContact(contact));
    showToast(`${contacts.length} contatos importados com sucesso!`, 'success');
  };

  const handleAddToKanban = (contactIds: string[]) => {
    const contacts = useContactsStore.getState().contacts;
    const selectedContacts = contacts.filter(c => contactIds.includes(c.id));
    const prospectingList = lists.find(l => l.title === 'Prospecção') || lists[0];

    if (prospectingList) {
      selectedContacts.forEach(contact => {
        addClient(prospectingList.id, {
          name: contact.name,
          description: `Contato: ${contact.phone}`,
          value: 0,
          priority: 'Média',
          dueDate: new Date().toISOString(),
          tagIds: contact.tagIds,
          customFields: contact.customFields,
        });
      });

      showToast(`${selectedContacts.length} contatos adicionados ao Kanban!`, 'success');
      navigate('/dashboard/clients');
    }
  };

  const handleAddToMessaging = (contactIds: string[]) => {
    console.log('Contacts - Adicionando contatos à lista de disparo:', contactIds);
    
    // Obter detalhes dos contatos para confirmar que estão sendo enviados corretamente
    const selectedContactsDetails = useContactsStore.getState().contacts
      .filter(c => contactIds.includes(c.id))
      .map(c => `${c.name} (${c.phone})`);
    
    console.log('Contacts - Detalhes dos contatos selecionados:', selectedContactsDetails);
    
    try {
      // Salvar os IDs dos contatos selecionados na store de mensagens
      useMessagingStore.getState().setSelectedContacts(contactIds);
      
      // Também salvar no store de contatos (redundância para garantir)
      setSelectedContacts(contactIds);
      
      // Exibir toast de sucesso
      showToast(`${contactIds.length} contatos adicionados à lista de disparo!`, 'success');
      
      // Timeout curto para garantir que os stores sejam atualizados antes da navegação
      setTimeout(() => {
        // Navegar para a página de mensagens
        navigate('/dashboard/messaging');
      }, 100);
    } catch (error) {
      console.error('Erro ao adicionar contatos à lista de disparo:', error);
      showToast('Erro ao adicionar contatos à lista de disparo', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Contatos
        </h1>
        <button
          onClick={() => {
            setEditingContact(null);
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Contato
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ContactImporter onImport={handleImportContacts} />
        </div>
        <div className="lg:col-span-2">
          <ContactList
            onEdit={handleEditContact}
            onAddToKanban={handleAddToKanban}
            onAddToMessaging={handleAddToMessaging}
          />
        </div>
      </div>

      {showModal && (
        <ContactModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingContact(null);
          }}
          onSave={editingContact ? handleUpdateContact : handleAddContact}
          contact={editingContact}
        />
      )}
    </div>
  );
}