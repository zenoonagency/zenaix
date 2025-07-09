import { CustomField } from '../../types/customFields';

export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type ContractStatus = 'Active' | 'Pending' | 'Draft';

export interface ContractVersion {
  id: string;
  timestamp: string;
  modifiedBy: string;
  changes: string;
}

export interface Contract {
  id: string;
  title: string;
  description: string;
  file: string;
  expirationDate: string;
  lastModified: string;
  status: ContractStatus;
  value: number;
  clientName: string;
  versions: ContractVersion[];
  customFields?: Record<string, CustomField>;
}