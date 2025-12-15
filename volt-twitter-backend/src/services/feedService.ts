import { Prisma, User as PrismaUser } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthorProfileResponse, NotificationResponse, PostResponse, ProfileResponse, TrendTopic, User } from '../models';

type UserWithCounts = PrismaUser & { _count?: { followers: number; following: number } };
type PostWithAuthor = Prisma.PostGetPayload<{ include: { author: true } }>;
type NotificationWithUser = Prisma.NotificationGetPayload<{ include: { relatedUser: true } }>;
type ProfileWithRelations = Prisma.ProfileGetPayload<{
  include: {
    user: {
      include: {
        _count: {
          select: { followers: true, following: true };
        };
      };
    };
    pinnedPost: { include: { author: true } };
  };
}>;

const mapUser = (user: UserWithCounts): User => ({
  id: user.id,
  handle: user.handle,
  displayName: user.displayName,
  avatar: user.avatar,
  tagline: user.tagline,
  bio: user.bio,
  location: user.location,
  followers: user._count?.followers,
  following: user._count?.following,
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
  author: mapUser(post.author as UserWithCounts),
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

const mapProfile = (profile: ProfileWithRelations): ProfileResponse => {
  const followerCount = profile.user._count?.followers ?? profile.followers;
  const followingCount = profile.user._count?.following ?? profile.following;

  return {
    user: mapUser(profile.user as UserWithCounts),
    bio: profile.bio,
    location: profile.location,
    stats: {
      followers: followerCount,
      following: followingCount,
      posts: profile.posts,
    },
    pinnedPost: profile.pinnedPost ? mapPost(profile.pinnedPost) : undefined,
  };
};

export const getTimeline = async (handle?: string): Promise<PostResponse[]> => {
  const { userId } = await resolveUserContext(handle);
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const authorIds = new Set<string>([userId]);
  following.forEach((entry) => authorIds.add(entry.followingId));

  const posts = await prisma.post.findMany({
    where: { parentPostId: null, authorId: { in: Array.from(authorIds) } },
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

export const getProfile = async (handle?: string): Promise<ProfileResponse> => {
  const profile = await prisma.profile.findFirst({
    where: handle ? { user: { handle } } : undefined,
    include: {
      user: {
        include: {
          _count: {
            select: { followers: true, following: true },
          },
        },
      },
      pinnedPost: { include: { author: true } },
    },
  });

  if (!profile) {
    throw new Error('Profile record not found');
  }

  return mapProfile(profile);
};

export const getAuthorProfile = async (identifier: string): Promise<AuthorProfileResponse> => {
  const viewerProfile = await requireProfile();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ handle: identifier }, { id: identifier }],
    },
    include: {
      posts: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { followers: true, following: true },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isViewer = user.id === viewerProfile.userId;
  let viewerIsFollowing = false;
  if (!isViewer) {
    const relation = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerProfile.userId,
          followingId: user.id,
        },
      },
      select: { id: true },
    });
    viewerIsFollowing = Boolean(relation);
  }

  return {
    user: mapUser(user as UserWithCounts),
    bio: user.bio,
    location: user.location,
    stats: {
      followers: user._count?.followers ?? 0,
      following: user._count?.following ?? 0,
      posts: user.posts.length,
    },
    posts: user.posts.map(mapPost),
    viewerIsFollowing,
    isViewer,
  };
};

export const requireProfile = async () => {
  const profile = await prisma.profile.findFirst({ include: { user: true } });
  if (!profile) {
    throw new Error('Profile record not found');
  }
  return profile;
};

const resolveUserContext = async (handle?: string) => {
  if (handle) {
    const user = await prisma.user.findUnique({ where: { handle } });
    if (!user) {
      throw new Error('User not found');
    }
    return { userId: user.id };
  }

  const profile = await requireProfile();
  return { userId: profile.userId };
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

export const createPostForUser = async (identifier: string, content: string): Promise<PostResponse> => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Post content cannot be empty');
  }

  const user = await findUserOrThrow(identifier);
  const newPost = await prisma.post.create({
    data: {
      authorId: user.id,
      content: trimmed,
    },
    include: { author: true },
  });

  return mapPost(newPost);
};

export const createReplyForUser = async (identifier: string, postId: string, content: string): Promise<PostResponse> => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Reply content cannot be empty');
  }

  const parent = await prisma.post.findUnique({ where: { id: postId } });
  if (!parent) {
    throw new Error('Parent post not found');
  }

  const user = await findUserOrThrow(identifier);

  const [reply] = await prisma.$transaction([
    prisma.post.create({
      data: {
        authorId: user.id,
        content: trimmed,
        parentPostId: postId,
      },
      include: { author: true },
    }),
    prisma.post.update({
      where: { id: postId },
      data: { replies: { increment: 1 } },
    }),
  ]);

  return mapPost(reply);
};

const findUserByIdentifier = (identifier: string) =>
  prisma.user.findFirst({
    where: {
      OR: [{ handle: identifier }, { id: identifier }],
    },
  });

const findUserOrThrow = async (identifier: string) => {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export const followUser = async (identifier: string): Promise<AuthorProfileResponse> => {
  const viewerProfile = await requireProfile();
  const target = await findUserByIdentifier(identifier);

  if (!target) {
    throw new Error('User not found');
  }

  if (target.id === viewerProfile.userId) {
    throw new Error('Cannot follow yourself');
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: viewerProfile.userId,
        followingId: target.id,
      },
    },
    update: {},
    create: {
      followerId: viewerProfile.userId,
      followingId: target.id,
    },
  });

  return getAuthorProfile(target.handle);
};

export const unfollowUser = async (identifier: string): Promise<AuthorProfileResponse> => {
  const viewerProfile = await requireProfile();
  const target = await findUserByIdentifier(identifier);

  if (!target) {
    throw new Error('User not found');
  }

  if (target.id === viewerProfile.userId) {
    throw new Error('Cannot unfollow yourself');
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: viewerProfile.userId,
      followingId: target.id,
    },
  });

  return getAuthorProfile(target.handle);
};

const includeUserCounts = {
  _count: {
    select: { followers: true, following: true },
  },
};

export const getFollowersForUser = async (identifier: string): Promise<User[]> => {
  const target = await findUserOrThrow(identifier);
  const followers = await prisma.user.findMany({
    where: {
      following: {
        some: { followingId: target.id },
      },
    },
    include: includeUserCounts,
    orderBy: { displayName: 'asc' },
  });

  return followers.map((user) => mapUser(user as UserWithCounts));
};

export const getFollowingForUser = async (identifier: string): Promise<User[]> => {
  const target = await findUserOrThrow(identifier);
  const following = await prisma.user.findMany({
    where: {
      followers: {
        some: { followerId: target.id },
      },
    },
    include: includeUserCounts,
    orderBy: { displayName: 'asc' },
  });

  return following.map((user) => mapUser(user as UserWithCounts));
};
