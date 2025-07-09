export type CustomFieldType = 'text' | 'number' | 'date' | 'email' | 'phone' | 'url';

export interface CustomField {
  type: CustomFieldType;
  value: string;
}

export interface CustomFieldInput {
  id: string;
  name: string;
  type: CustomFieldType;
  value: string;
}

export function renderCustomFieldValue(field: CustomField): string {
  switch (field.type) {
    case 'date':
      return new Date(field.value).toLocaleDateString('pt-BR');
    case 'phone':
      return field.value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    default:
      return field.value;
  }
}

export function validateCustomField(field: CustomField): boolean {
  switch (field.type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
    case 'phone':
      return /^\d{10,11}$/.test(field.value.replace(/\D/g, ''));
    case 'url':
      try {
        new URL(field.value);
        return true;
      } catch {
        return false;
      }
    case 'date':
      return !isNaN(Date.parse(field.value));
    case 'number':
      return !isNaN(Number(field.value));
    default:
      return true;
  }
} 