import { Tag } from '../../store/tagStore';

export type CustomFieldType = 'text' | 'number' | 'date' | 'boolean' | 'file';

export interface CustomField {
  type: CustomFieldType;
  value: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  tagIds: string[];
  customFields?: Record<string, CustomField>;
  createdAt: string;
  updatedAt: string;
}

export interface ContactsState {
  contacts: Contact[];
  selectedContacts: string[];
  selectedTags: string[];
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  toggleContactSelection: (id: string) => void;
  selectAllContacts: (contactIds: string[]) => void;
  clearSelection: () => void;
  setSelectedTags: (tagIds: string[]) => void;
}