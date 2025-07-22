// API-related type definitions

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  'invalid-params'?: Array<{
    name: string;
    reason: string;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API endpoint paths
export const API_ENDPOINTS = {
  ARTISTS: '/v1/artists',
  ARTIST_BY_ID: (id: string) => `/v1/artists/${id}`,
  STYLES: '/v1/styles',
  REMOVAL_REQUEST: '/v1/removal-requests',
  HEALTH: '/v1/health'
} as const;