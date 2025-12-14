const baseUrl = process.env.TWITTER_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Twitter API request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export const fetchTimeline = (handle: string) => apiRequest(`/api/timeline?handle=${encodeURIComponent(handle)}`);
export const fetchProfile = (handle: string) => apiRequest(`/api/users/${encodeURIComponent(handle)}`);
