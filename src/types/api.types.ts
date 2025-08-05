export interface ApiResponse<T> {
  message: string;
  errors?: Record<string, string[]>;
  data: T;
  status: number;
}

export type ErrorApiResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
