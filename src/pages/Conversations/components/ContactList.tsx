import React, { useState } from "react";
import { MoreVertical, Pin, Plus, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrar contatos baseado na busca
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery)
  );

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

      {/* Barra de pesquisa - sempre visível */}
      <div className="p-4 border-b">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-300" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-dark-600 rounded-md leading-5 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent"
            placeholder="Buscar contatos..."
          />
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              onClick={() => setSearchQuery("")}
              tabIndex={-1}
              type="button"
              aria-label="Limpar busca"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            {searchQuery ? (
              <div>
                <div className="mb-2">
                  Nenhum contato encontrado para "{searchQuery}"
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm underline"
                >
                  Criar novo contato
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-2">Nenhum contato encontrado</div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm underline"
                >
                  Criar primeiro contato
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`relative flex items-center gap-3 px-4 py-3 border-b hover:bg-[#f5f5ff] dark:hover:bg-[#23233a] ${
                selectedContactId === contact.id
                  ? "bg-[#f5f5ff] dark:bg-[#23233a]"
                  : ""
              }`}
            >
              <button
                className="flex items-center gap-3 flex-1 min-w-0"
                onClick={() => setSelectedContactId(contact.id)}
              >
                {contact.avatar_url ? (
                  <img
                    src={processWhatsAppImageUrl(contact.avatar_url)}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : null}
                <div
                  className={`w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-lg uppercase flex-shrink-0 ${
                    contact.avatar_url ? "hidden" : ""
                  }`}
                >
                  {contact.name?.[0] || contact.phone?.slice(-2) || "?"}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="truncate" title={contact.name}>
                      {contact.name}
                    </span>
                    {contact.is_pinned && (
                      <div className="flex items-center justify-center w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0">
                        <Pin className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div
                    className="text-xs text-gray-500 truncate"
                    title={contact.phone}
                  >
                    {contact.phone}
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => handleContactMenuClick(e, contact.id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors flex-shrink-0"
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
