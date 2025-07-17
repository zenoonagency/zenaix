export type TransactionType = "INCOME" | "EXPENSE";
export type TransactionStatus = "PENDING" | "COMPLETED" | "CANCELED";

export interface InputCreateTransactionDTO {
  description: string;
  value: number;
  category?: string;
  type: TransactionType;
  status?: TransactionStatus;
  date: string;
}

export interface InputUpdateTransactionDTO {
  description?: string;
  value?: number;
  category?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  date?: string;
}

export interface OutputTransactionDTO {
  id: string;
  description: string;
  value: number;
  category: string | null;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummaryDTO {
  income: number;
  expenses: number;
  balance: number;
}
