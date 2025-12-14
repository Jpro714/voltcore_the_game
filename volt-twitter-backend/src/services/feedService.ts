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
  parentId: post.parentPostId,
  author: mapUser(post.author),
});

const mapPostWithThread = (post: PostWithAuthor, thread: PostResponse[]): PostResponse => ({
  ...mapPost(post),
  thread,
});

const fetchRepliesRecursive = async (parentId: string): Promise<PostResponse[]> => {
  const replies = await prisma.post.findMany({
    where: { parentPostId: parentId },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  });

  return Promise.all(
    replies.map(async (reply) => mapPostWithThread(reply, await fetchRepliesRecursive(reply.id))),
  );
};

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
    where: { parentPostId: null },
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });
  return posts.map(mapPost);
};

export const getPostById = async (id: string): Promise<PostResponse> => {
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: true },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  const thread = await fetchRepliesRecursive(post.id);
  return mapPostWithThread(post, thread);
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

const requireProfile = async () => {
  const profile = await prisma.profile.findFirst({ include: { user: true } });
  if (!profile) {
    throw new Error('Profile record not found');
  }
  return profile;
};

export const createPost = async (content: string): Promise<PostResponse> => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Post content cannot be empty');
  }

  const profile = await requireProfile();

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

export const createReply = async (postId: string, content: string): Promise<PostResponse> => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Reply content cannot be empty');
  }

  const parent = await prisma.post.findUnique({ where: { id: postId } });
  if (!parent) {
    throw new Error('Parent post not found');
  }

  const profile = await requireProfile();

  const [reply] = await prisma.$transaction([
    prisma.post.create({
      data: {
        authorId: profile.userId,
        content: trimmed,
        parentPostId: postId,
      },
      include: { author: true },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { replies: { increment: 1 } },
    }),
    prisma.profile.update({
      where: { id: profile.id },
      data: { posts: { increment: 1 } },
    }),
  ]);

  return mapPost(reply);
};

export const likePost = async (postId: string): Promise<PostResponse> => {
  const updated = await prisma.post.update({
    where: { id: postId },
    data: { likes: { increment: 1 } },
    include: { author: true },
  });

  return mapPost(updated);
};
