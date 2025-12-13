const rawBaseUrl = import.meta.env.VITE_API_URL?.trim() ?? '';
export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');
export const isApiEnabled = Boolean(API_BASE_URL);

interface RequestOptions extends RequestInit {
  skipJson?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL is not configured.');
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (options.skipJson) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
