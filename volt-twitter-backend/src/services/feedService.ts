import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { NotificationResponse, PostResponse, ProfileResponse, TrendTopic, User } from '../models';

type PostWithAuthor = Prisma.PostGetPayload<{ include: { author: true } }>;
type NotificationWithUser = Prisma.NotificationGetPayload<{ include: { relatedUser: true } }>;
type ProfileWithRelations = Prisma.ProfileGetPayload<{
  include: { user: true; pinnedPost: { include: { author: true } } };
}>;

const mapUser = (user: Prisma.User): User => ({
  id: user.id,
  handle: user.handle,
  displayName: user.displayName,
  avatar: user.avatar,
  tagline: user.tagline,
});

const mapPost = (post: PostWithAuthor): PostResponse => ({
  id: post.id,
  content: post.content,
  timestamp: post.createdAt.toISOString(),
  likes: post.likes,
  replies: post.replies,
  reposts: post.reposts,
  isPinned: post.isPinned,
  author: mapUser(post.author),
});

const mapNotification = (notification: NotificationWithUser): NotificationResponse => ({
  id: notification.id,
  type: notification.type,
  message: notification.message,
  timestamp: notification.createdAt.toISOString(),
  relatedUser: mapUser(notification.relatedUser),
});

const mapProfile = (profile: ProfileWithRelations): ProfileResponse => ({
  user: mapUser(profile.user),
  bio: profile.bio,
  location: profile.location,
  stats: {
    followers: profile.followers,
    following: profile.following,
    posts: profile.posts,
  },
  pinnedPost: profile.pinnedPost ? mapPost(profile.pinnedPost) : undefined,
});

export const getTimeline = async (): Promise<PostResponse[]> => {
  const posts = await prisma.post.findMany({
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });
  return posts.map(mapPost);
};

export const getNotifications = async (): Promise<NotificationResponse[]> => {
  const notifications = await prisma.notification.findMany({
    include: { relatedUser: true },
    orderBy: { createdAt: 'desc' },
  });
  return notifications.map(mapNotification);
};

export const getTrendingTopics = async (): Promise<TrendTopic[]> => {
  const topics = await prisma.trendingTopic.findMany({
    orderBy: { posts: 'desc' },
  });
  return topics.map((topic) => ({
    id: topic.id,
    hashtag: topic.hashtag,
    posts: topic.posts,
    description: topic.description,
  }));
};

export const getProfile = async (): Promise<ProfileResponse> => {
  const profile = await prisma.profile.findFirst({
    include: {
      user: true,
      pinnedPost: { include: { author: true } },
    },
  });

  if (!profile) {
    throw new Error('Profile record not found');
  }

  return mapProfile(profile);
};

export const createPost = async (content: string): Promise<PostResponse> => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Post content cannot be empty');
  }

  const profile = await prisma.profile.findFirst({ include: { user: true } });
  if (!profile) {
    throw new Error('Profile record not found');
  }

  const [newPost] = await prisma.$transaction([
    prisma.post.create({
      data: {
        authorId: profile.userId,
        content: trimmed,
      },
      include: { author: true },
    }),
    prisma.profile.update({
      where: { id: profile.id },
      data: { posts: { increment: 1 } },
    }),
  ]);

  return mapPost(newPost);
};
