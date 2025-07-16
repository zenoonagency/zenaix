// Tipos para Contrato
export type ContractStatus = "DRAFT" | "PENDING" | "ACTIVE";

export interface ContractOutput {
  id: string;
  title: string;
  description?: string;
  client_name: string;
  status: ContractStatus;
  value: number;
  expiration_date: string;
  pdf_file_name?: string;
  pdf_file_type?: string;
  pdf_file_size?: number;
  organization_id: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface InputCreateContractDTO {
  title: string;
  description?: string;
  client_name: string;
  status: ContractStatus;
  value: number;
  expiration_date: string;
  file?: File;
}

export interface InputUpdateContractDTO {
  title?: string;
  description?: string;
  client_name?: string;
  status?: ContractStatus;
  value?: number;
  expiration_date?: string;
}
