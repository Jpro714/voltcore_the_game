export interface User {
  id: string;
  handle: string;
  displayName: string;
  avatar: string;
  tagline?: string | null;
}

export interface PostResponse {
  id: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
  reposts: number;
  isPinned?: boolean | null;
  author: User;
}

export interface NotificationResponse {
  id: string;
  type: 'like' | 'reply' | 'follow';
  message: string;
  timestamp: string;
  relatedUser: User;
}

export interface TrendTopic {
  id: string;
  hashtag: string;
  posts: number;
  description?: string | null;
}

export interface ProfileResponse {
  user: User;
  bio: string;
  location?: string | null;
  stats: {
    followers: number;
    following: number;
    posts: number;
  };
  pinnedPost?: PostResponse;
}
