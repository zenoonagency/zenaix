import React, { useState } from "react";
import { MoreVertical, Pin, Plus } from "lucide-react";
import { EditContactModal } from "../../../components/EditContactModal";

export function ContactList({
  contacts,
  selectedContactId,
  setSelectedContactId,
  handleContactMenuClick,
  processWhatsAppImageUrl,
  onCreateContact,
  instanceId,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="w-80 border-r bg-white dark:bg-dark-900 flex flex-col">
      <div className="p-4 font-bold text-lg border-b flex items-center justify-between">
        <span>Contatos</span>
        <button
          onClick={() => setShowCreateModal(true)}
          className="ml-2 p-1 rounded-full text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          title="Adicionar contato"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            Nenhum contato encontrado
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className={`relative flex items-center gap-3 px-4 py-3 border-b hover:bg-[#f5f5ff] dark:hover:bg-[#23233a] ${
                selectedContactId === contact.id
                  ? "bg-[#f5f5ff] dark:bg-[#23233a]"
                  : ""
              }`}
            >
              <button
                className="flex items-center gap-3 flex-1"
                onClick={() => setSelectedContactId(contact.id)}
              >
                {contact.avatar_url ? (
                  <img
                    src={processWhatsAppImageUrl(contact.avatar_url)}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : null}
                <div
                  className={`w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-lg uppercase ${
                    contact.avatar_url ? "hidden" : ""
                  }`}
                >
                  {contact.name?.[0] || contact.phone?.slice(-2) || "?"}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {contact.name}
                    {contact.is_pinned && (
                      <div className="flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Pin className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{contact.phone}</div>
                </div>
              </button>
              <button
                onClick={(e) => handleContactMenuClick(e, contact.id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                title="Opções"
              >
                <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ))
        )}
      </div>
      <EditContactModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        contact={null}
        instanceId={instanceId}
        onUpdate={() => {}}
        onCreate={(contact) => {
          setShowCreateModal(false);
          if (onCreateContact) onCreateContact(contact);
        }}
      />
    </div>
  );
}
