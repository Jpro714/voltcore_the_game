export interface User {
  id: string;
  handle: string;
  displayName: string;
  avatar: string;
  tagline?: string;
  bio?: string;
  location?: string;
  followers?: number;
  following?: number;
}

export interface Tweet {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
  reposts: number;
  isPinned?: boolean;
  parentId?: string;
  thread?: Tweet[];
}

export interface NotificationItem {
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
  description?: string;
}

export interface ProfileSummary {
  user: User;
  bio: string;
  location?: string;
  stats: {
    followers: number;
    following: number;
    posts: number;
  };
  pinnedTweet?: Tweet;
}

export interface AuthorProfile {
  user: User;
  bio?: string;
  location?: string;
  stats: {
    followers: number;
    following: number;
    posts: number;
  };
  posts: Tweet[];
}
