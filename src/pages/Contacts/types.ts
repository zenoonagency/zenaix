export interface Contact {
  id: string;
  name: string;
  phone: string;
  tagIds: string[];
  customFields?: Record<string, CustomField>;
  createdAt: string;
  updatedAt: string;
}
