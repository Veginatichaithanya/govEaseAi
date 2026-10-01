/**
 * GovEaseAI Centralized API Client
 * Provides unified HTTP operations connecting frontend to FastAPI backend.
 * Includes dynamic backend resolution, Render cold-start tolerance, health probing,
 * and user-configurable backend URL overrides for cloud deployments.
 */

const AUTH_TOKEN_STORAGE_KEY = 'govease_auth_token';
const API_BASE_URL_STORAGE_KEY = 'govease_api_base_url';

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

export function getStoredApiUrl(): string | null {
  try {
    return localStorage.getItem(API_BASE_URL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredApiUrl(url: string | null): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(API_BASE_URL_STORAGE_KEY, url.trim());
    } else {
      localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to update custom API URL:', err);
  }
}

export function getApiBaseUrl(): string {
  // 1. Check custom override saved in localStorage
  const stored = getStoredApiUrl();
  if (stored && stored.trim()) {
    let clean = stored.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
      clean = `https://${clean}`;
    }
    return clean;
  }

  // 2. Read environment variable (VITE_API_BASE_URL)
  let configuredBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

  // 3. If running in browser on *.onrender.com, automatically route to the public Render backend
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.onrender.com')) {
    if (!configuredBase || configuredBase === '/api' || !configuredBase.includes('.')) {
      configuredBase = 'https://goveaseai-backend.onrender.com';
    }
  }

  // 4. If configuredBase is just a service name (e.g. 'goveaseai-backend' without domain)
  if (configuredBase && !configuredBase.startsWith('/') && !configuredBase.includes('.')) {
    configuredBase = `${configuredBase}.onrender.com`;
  }

  // 5. Prepend https:// if protocol is missing and not relative path
  if (
    configuredBase &&
    !configuredBase.startsWith('/') &&
    !configuredBase.startsWith('http://') &&
    !configuredBase.startsWith('https://')
  ) {
    configuredBase = `https://${configuredBase}`;
  }

  if (!configuredBase) {
    configuredBase = '/api';
  }

  return configuredBase;
}

export interface HealthCheckResult {
  ok: boolean;
  status: number;
  latencyMs: number;
  url: string;
  database?: string;
  service?: string;
}

/**
 * Pings the backend health endpoint. Useful for warming up sleeping Render instances
 * in the background and diagnosing connectivity in the UI.
 */
export async function pingApiHealth(timeoutMs = 12000): Promise<HealthCheckResult> {
  const base = getApiBaseUrl();
  const baseWithoutApi = base.replace(/\/api$/, '');
  const url = (base.startsWith('http://') || base.startsWith('https://'))
    ? `${baseWithoutApi}/api/health`
    : '/api/health';

  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - start);
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // not json
    }
    return {
      ok: res.ok,
      status: res.status,
      latencyMs,
      url,
      database: json?.database,
      service: json?.service
    };
  } catch {
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - start);
    return {
      ok: false,
      status: 0,
      latencyMs,
      url
    };
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
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  // If body is not FormData, ensure Content-Type is application/json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const configuredBase = getApiBaseUrl();
  const baseWithoutApi = configuredBase.replace(/\/api$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const path = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  const url = (configuredBase.startsWith('http://') || configuredBase.startsWith('https://'))
    ? `${baseWithoutApi}${path}`
    : path;

  // Use 45s timeout to comfortably accommodate Render free-tier cold-start spins
  const controller = new AbortController();
  const timeoutMs = 45000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal
    });
    clearTimeout(timeoutId);

    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorMessage =
        data?.detail ||
        data?.error ||
        data?.message ||
        `HTTP ${response.status} request failure`;
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
    clearTimeout(timeoutId);
    console.error(`[API Client] Network error on ${url}:`, err);
    const isTimeout = err?.name === 'AbortError';
    const isNetworkError = err?.message === 'Failed to fetch' || err?.name === 'TypeError' || isTimeout;
    const friendlyMsg = isTimeout
      ? 'The request timed out waiting for the server. Render free-tier instances may take 45–60s to wake up on the first request. Please try again.'
      : isNetworkError
      ? 'Unable to connect to the backend server. If the server is in sleep mode, it may take up to 45 seconds to wake up. Please check your network and try again.'
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
