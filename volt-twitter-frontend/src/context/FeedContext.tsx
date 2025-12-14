import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createPost as createPostRequest,
  fetchNotifications,
  fetchProfileSummary,
  fetchTimeline,
  fetchTrendingTopics,
  likeTweet as likeTweetRequest,
  replyToPost as replyToPostRequest,
} from '../api/feedApi';
import { NotificationItem, ProfileSummary, TrendTopic, Tweet } from '../types/feed';

interface FeedContextValue {
  timeline: Tweet[];
  notifications: NotificationItem[];
  trendingTopics: TrendTopic[];
  profile: ProfileSummary | null;
  isLoading: boolean;
  isPosting: boolean;
  refresh: () => Promise<void>;
  createPost: (content: string) => Promise<void>;
  likeTweet: (tweetId: string) => Promise<Tweet>;
  replyToPost: (targetId: string, content: string, rootId?: string) => Promise<Tweet>;
}

const FeedContext = createContext<FeedContextValue | undefined>(undefined);

interface FeedProviderProps {
  children: ReactNode;
}

export const FeedProvider = ({ children }: FeedProviderProps) => {
  const [timeline, setTimeline] = useState<Tweet[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendTopic[]>([]);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const [timelineResponse, notificationResponse, trendsResponse, profileResponse] = await Promise.all([
      fetchTimeline(),
      fetchNotifications(),
      fetchTrendingTopics(),
      fetchProfileSummary(),
    ]);

    setTimeline(timelineResponse);
    setNotifications(notificationResponse);
    setTrendingTopics(trendsResponse);
    setProfile(profileResponse);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPost = useCallback(async (content: string) => {
    if (!content.trim()) {
      return;
    }

    setIsPosting(true);
    try {
      const newPost = await createPostRequest(content);
      setTimeline((prev) => [newPost, ...prev]);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              stats: {
                ...prev.stats,
                posts: prev.stats.posts + 1,
              },
            }
          : prev,
      );
    } finally {
      setIsPosting(false);
    }
  }, []);

  const updateTimelineEntry = useCallback((updated: Tweet) => {
    setTimeline((prev) => prev.map((tweet) => (tweet.id === updated.id ? { ...tweet, ...updated } : tweet)));
  }, []);

  const likeTweet = useCallback(
    async (tweetId: string) => {
      const updated = await likeTweetRequest(tweetId);
      updateTimelineEntry(updated);
      return updated;
    },
    [updateTimelineEntry],
  );

  const replyToPost = useCallback(
    async (targetId: string, content: string, rootId?: string) => {
      const reply = await replyToPostRequest(targetId, content);
      const targetTimelineId = rootId ?? targetId;
      setTimeline((prev) =>
        prev.map((tweet) =>
          tweet.id === targetTimelineId ? { ...tweet, replies: tweet.replies + 1 } : tweet,
        ),
      );
      return reply;
    },
    [],
  );

  const value = useMemo<FeedContextValue>(
    () => ({
      timeline,
      notifications,
      trendingTopics,
      profile,
      isLoading,
      isPosting,
      refresh,
      createPost,
      likeTweet,
      replyToPost,
    }),
    [
      timeline,
      notifications,
      trendingTopics,
      profile,
      isLoading,
      isPosting,
      refresh,
      createPost,
      likeTweet,
      replyToPost,
    ],
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used inside FeedProvider');
  }

  return context;
};
