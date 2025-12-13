import { apiRequest, isApiEnabled } from './config';
import { mockNotifications, mockProfile, mockTimeline, mockTrendingTopics, playerUser } from '../data/mockFeed';
import { NotificationItem, ProfileSummary, TrendTopic, Tweet } from '../types/feed';

const clone = <T>(input: T): T => JSON.parse(JSON.stringify(input));

const fromMock = async <T>(value: T, delay = 250): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(clone(value)), delay));

const fallbackFetch = async <T>(request: () => Promise<T>, fallbackValue: T, delay = 250): Promise<T> => {
  if (isApiEnabled) {
    try {
      return await request();
    } catch (error) {
      console.warn('API request failed, falling back to mock data.', error);
    }
  }
  return fromMock(fallbackValue, delay);
};

export const fetchTimeline = () =>
  fallbackFetch<Tweet[]>(() => apiRequest<Tweet[]>('/api/timeline'), mockTimeline, 350);

export const fetchNotifications = () =>
  fallbackFetch<NotificationItem[]>(() => apiRequest<NotificationItem[]>('/api/notifications'), mockNotifications);

export const fetchTrendingTopics = () =>
  fallbackFetch<TrendTopic[]>(() => apiRequest<TrendTopic[]>('/api/trending'), mockTrendingTopics, 200);

export const fetchProfileSummary = () =>
  fallbackFetch<ProfileSummary>(() => apiRequest<ProfileSummary>('/api/profile'), mockProfile, 200);

export const createPost = async (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Post must contain text.');
  }

  if (isApiEnabled) {
    return apiRequest<Tweet>('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: trimmed }),
    });
  }

  const newTweet: Tweet = {
    id: `player-${Date.now()}`,
    author: playerUser,
    content: trimmed,
    timestamp: new Date().toISOString(),
    likes: 0,
    replies: 0,
    reposts: 0,
  };

  mockTimeline.unshift(newTweet);
  return fromMock(newTweet, 300);
};
