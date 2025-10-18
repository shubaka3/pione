import { storage } from '@/utils/common';
import { API_BASE_URL } from '@/constants/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_BASE_URL;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const token = options.token || storage.getToken();
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    });

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Network response was not ok');
    }

    // If 204 No Content, return undefined (caller should handle it)
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    // Attempt to parse JSON; if there's no JSON body, return undefined
    const text = await response.text();
    if (!text) {
      return undefined as unknown as T;
    }

    return JSON.parse(text) as T;
  }

  public async get<T>(endpoint: string, options: FetchOptions = {}) {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, data: unknown, options: FetchOptions = {}) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async put<T>(endpoint: string, data: unknown, options: FetchOptions = {}) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async delete(endpoint: string, options: FetchOptions = {}) {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
  }
}