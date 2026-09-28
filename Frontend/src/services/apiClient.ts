/**
 * GovEaseAI Centralized API Client
 * Provides unified HTTP operations connecting frontend to FastAPI backend.
 */

const AUTH_TOKEN_STORAGE_KEY = 'govease_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.warn('Failed to save auth token:', err);
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // safe fallback
  }
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  // If body is not FormData, ensure Content-Type is application/json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let configuredBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

  // 1. If running in browser on *.onrender.com, automatically route to the public Render backend
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.onrender.com')) {
    if (!configuredBase || configuredBase === '/api' || !configuredBase.includes('.')) {
      configuredBase = 'https://goveaseai-backend.onrender.com';
    }
  }

  // 2. If configuredBase is just a service name (e.g. 'goveaseai-backend' without domain)
  if (configuredBase && !configuredBase.startsWith('/') && !configuredBase.includes('.')) {
    configuredBase = `${configuredBase}.onrender.com`;
  }

  // 3. Prepend https:// if protocol is missing and not relative path
  if (configuredBase && !configuredBase.startsWith('/') && !configuredBase.startsWith('http://') && !configuredBase.startsWith('https://')) {
    configuredBase = `https://${configuredBase}`;
  }

  if (!configuredBase) {
    configuredBase = '/api';
  }

  const baseWithoutApi = configuredBase.replace(/\/api$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const path = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  const url = (configuredBase.startsWith('http://') || configuredBase.startsWith('https://'))
    ? `${baseWithoutApi}${path}`
    : path;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorMessage = data?.detail || data?.error || data?.message || `HTTP ${response.status} request failure`;
      return {
        data,
        error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        status: response.status,
        ok: false
      };
    }

    return {
      data,
      status: response.status,
      ok: true
    };
  } catch (err: any) {
    console.error(`[API Client] Network error on ${url}:`, err);
    const isNetworkError = err?.message === 'Failed to fetch' || err?.name === 'TypeError';
    const friendlyMsg = isNetworkError
      ? 'Unable to connect to the server. If the server is in sleep mode, it may take up to 45 seconds to wake up. Please try again.'
      : (err.message || 'Network connectivity failure.');
    return {
      error: friendlyMsg,
      status: 0,
      ok: false
    };
  }
}

export const apiClient = {
  get<T = any>(endpoint: string) {
    return apiRequest<T>(endpoint, { method: 'GET' });
  },
  post<T = any>(endpoint: string, body?: any) {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },
  put<T = any>(endpoint: string, body?: any) {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },
  delete<T = any>(endpoint: string) {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  }
};
