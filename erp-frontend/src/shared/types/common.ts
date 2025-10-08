// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// API Response
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

// Loading state
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Filter state
export interface FilterState {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

// Sort state
export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// Generic CRUD state
export interface CrudState<T> extends LoadingState {
  data: T[];
  selectedItem: T | null;
  pagination: PaginationMeta;
  filters: FilterState;
  sort: SortState | null;
}

