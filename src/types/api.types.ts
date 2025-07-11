export interface ApiResponse<T> {
  message: string;
  data: T;
  status: number;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
