export const API_BASE_URL = 'http://localhost:8000/api';
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/token',
    CURRENT_USER: '/users/me',
  },
  TREES: {
    LIST: '/trees',
    DETAIL: (id: string) => `/trees/${id}`,
    READINGS: (id: string) => `/trees/${id}/readings`,
  },
} as const;