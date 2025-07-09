// src/store/contactsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contact } from '../types/contacts';
import { generateId } from '../utils/generateId';

interface ContactsState {
  contacts: Contact[];
  selectedContacts: string[];
  selectedTags: string[];
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  deleteAllContacts: () => void;
  toggleContactSelection: (id: string) => void;
  selectAllContacts: (contactIds: string[]) => void;
  clearSelection: () => void;
  setSelectedTags: (tagIds: string[]) => void;
}

export const useContactsStore = create<ContactsState>()(
  persist(
    (set) => ({
      contacts: [],
      selectedContacts: [],
      selectedTags: [],

      addContact: (contactData) => {
        const newContact = {
          ...contactData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          contacts: [...state.contacts, newContact],
        }));
      },

      updateContact: (id, updates) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id
              ? {
                  ...contact,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : contact
          ),
        }));
      },

      deleteContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
          selectedContacts: state.selectedContacts.filter(
            (selectedId) => selectedId !== id
          ),
        }));
      },

      deleteAllContacts: () => {
        set({ contacts: [], selectedContacts: [] });
      },

      toggleContactSelection: (id) => {
        set((state) => ({
          selectedContacts: state.selectedContacts.includes(id)
            ? state.selectedContacts.filter((selectedId) => selectedId !== id)
            : [...state.selectedContacts, id],
        }));
      },

      selectAllContacts: (contactIds) => {
        set({ selectedContacts: contactIds });
      },

      clearSelection: () => {
        set({ selectedContacts: [] });
      },

      setSelectedTags: (tagIds) => {
        set({ selectedTags: tagIds });
      },
    }),
    {
      name: 'contacts-store',
    }
  )
);
