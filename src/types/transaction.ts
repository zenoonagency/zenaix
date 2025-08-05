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

export interface TransactionState {
  transactions: OutputTransactionDTO[];
  summary: FinancialSummaryDTO | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastFilters: CachedFilters | null;

  setTransactions: (transactions: OutputTransactionDTO[]) => void;
  addTransaction: (transaction: OutputTransactionDTO) => void;
  updateTransaction: (transaction: OutputTransactionDTO) => void;
  deleteTransaction: (transactionId: string) => void;
  setSummary: (summary: FinancialSummaryDTO) => void;

  fetchAllTransactions: (
    token: string,
    organizationId: string,
    filters?: IDateFilters,
    forceRefresh?: boolean
  ) => Promise<void>;
  fetchSummary: (
    token: string,
    organizationId: string,
    filters?: IDateFilters
  ) => Promise<void>;
  cleanUserData: () => void;
}

export interface DashboardTransactionState {
  transactions: OutputTransactionDTO[];
  summary: FinancialSummaryDTO | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  lastFilters: CachedDashboardFilters | null;
  cleanUserData: () => void;

  setTransactions: (transactions: OutputTransactionDTO[]) => void;
  setSummary: (summary: FinancialSummaryDTO | null) => void;
  setLoading: (loading: boolean) => void;

  fetchDashboardTransactions: (
    token: string,
    organizationId: string,
    filters?: IDateRangeFilters,
    forceRefresh?: boolean
  ) => Promise<void>;

  fetchDashboardSummary: (
    token: string,
    organizationId: string,
    filters?: IDateRangeFilters
  ) => Promise<void>;

  clearError: () => void;
  clearCache: () => void;
}

export interface IDateFilters {
  year?: number;
  month?: number;
}

export interface CachedFilters extends IDateFilters {
  organizationId: string;
}

export interface IDateRangeFilters {
  startDate?: string;
  endDate?: string;
}

export interface CachedDashboardFilters extends IDateRangeFilters {
  organizationId: string;
}
