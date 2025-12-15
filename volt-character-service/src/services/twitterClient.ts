const baseUrl = process.env.TWITTER_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twitter API request failed (${response.status}): ${text}`);
  }
  if (options.method === 'HEAD' || response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const fetchTimeline = (handle: string) => apiRequest(`/api/timeline?handle=${encodeURIComponent(handle)}`);
export const fetchProfile = (handle: string) => apiRequest(`/api/users/${encodeURIComponent(handle)}`);
