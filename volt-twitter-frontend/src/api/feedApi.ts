import { apiRequest, isApiEnabled } from './config';
import {
  buildMockProfile,
  followMockAuthor,
  getMockAuthorProfile,
  getMockFollowers,
  getMockFollowing,
  getMockTweetWithThread,
  mockNotifications,
  mockTimeline,
  mockTrendingTopics,
  playerUser,
  recordMockLike,
  recordMockReply,
  unfollowMockAuthor,
} from '../data/mockFeed';
import { AuthorProfile, NotificationItem, ProfileSummary, TrendTopic, Tweet, User } from '../types/feed';

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
  fallbackFetch<ProfileSummary>(() => apiRequest<ProfileSummary>('/api/profile'), buildMockProfile(), 200);

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

export const fetchPostById = async (postId: string) => {
  if (isApiEnabled) {
    return apiRequest<Tweet>(`/api/posts/${encodeURIComponent(postId)}`);
  }

  const fallback = getMockTweetWithThread(postId);
  if (!fallback) {
    throw new Error('Post not found.');
  }
  return fromMock(fallback, 200);
};

export const replyToPost = async (postId: string, content: string) => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Reply must contain text.');
  }

  if (isApiEnabled) {
    return apiRequest<Tweet>(`/api/posts/${encodeURIComponent(postId)}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content: trimmed }),
    });
  }

  const newReply: Tweet = {
    id: `reply-${Date.now()}`,
    author: playerUser,
    content: trimmed,
    timestamp: new Date().toISOString(),
    likes: 0,
    replies: 0,
    reposts: 0,
    parentId: postId,
  };

  recordMockReply(postId, newReply);
  return fromMock(newReply, 200);
};

export const likeTweet = async (postId: string) => {
  if (isApiEnabled) {
    return apiRequest<Tweet>(`/api/posts/${encodeURIComponent(postId)}/like`, {
      method: 'POST',
    });
  }

  recordMockLike(postId);
  const liked = getMockTweetWithThread(postId) ?? mockTimeline.find((tweet) => tweet.id === postId);
  if (!liked) {
    throw new Error('Tweet not found.');
  }
  return fromMock(liked, 150);
};

export const fetchAuthorProfile = async (handle: string) => {
  if (isApiEnabled) {
    return apiRequest<AuthorProfile>(`/api/users/${encodeURIComponent(handle)}`);
  }

  const fallback = getMockAuthorProfile(handle);
  if (!fallback) {
    throw new Error('User not found.');
  }
  return fromMock(fallback, 200);
};

export const followAuthor = async (handle: string) => {
  if (isApiEnabled) {
    return apiRequest<AuthorProfile>(`/api/users/${encodeURIComponent(handle)}/follow`, {
      method: 'POST',
    });
  }

  const updated = followMockAuthor(handle);
  if (!updated) {
    throw new Error('User not found.');
  }
  return fromMock(updated, 150);
};

export const unfollowAuthor = async (handle: string) => {
  if (isApiEnabled) {
    return apiRequest<AuthorProfile>(`/api/users/${encodeURIComponent(handle)}/follow`, {
      method: 'DELETE',
    });
  }

  const updated = unfollowMockAuthor(handle);
  if (!updated) {
    throw new Error('User not found.');
  }
  return fromMock(updated, 150);
};

export const fetchFollowersList = async (handle: string) => {
  if (isApiEnabled) {
    return apiRequest<User[]>(`/api/users/${encodeURIComponent(handle)}/followers`);
  }

  const fallback = getMockFollowers(handle);
  if (!fallback) {
    throw new Error('User not found.');
  }
  return fromMock(fallback, 150);
};

export const fetchFollowingList = async (handle: string) => {
  if (isApiEnabled) {
    return apiRequest<User[]>(`/api/users/${encodeURIComponent(handle)}/following`);
  }

  const fallback = getMockFollowing(handle);
  if (!fallback) {
    throw new Error('User not found.');
  }
  return fromMock(fallback, 150);
};
