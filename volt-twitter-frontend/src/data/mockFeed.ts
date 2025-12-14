import { AuthorProfile, NotificationItem, ProfileSummary, TrendTopic, Tweet, User } from '../types/feed';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

const avatar = (seed: string) => `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;

export const mockFollowPairs: Array<{ followerId: string; followingId: string }> = [
  { followerId: 'player', followingId: 'voltcore' },
  { followerId: 'player', followingId: 'rumor' },
  { followerId: 'player', followingId: 'chemist' },
  { followerId: 'rumor', followingId: 'voltcore' },
  { followerId: 'chemist', followingId: 'voltcore' },
  { followerId: 'journalist', followingId: 'voltcore' },
  { followerId: 'journalist', followingId: 'rumor' },
  { followerId: 'voltcore', followingId: 'rumor' },
] ;

const followerCount = (userId: string) => mockFollowPairs.filter((pair) => pair.followingId === userId).length;
const followingCount = (userId: string) => mockFollowPairs.filter((pair) => pair.followerId === userId).length;
const isFollowing = (followerId: string, followingId: string) =>
  mockFollowPairs.some((pair) => pair.followerId === followerId && pair.followingId === followingId);

type UserSeed = Omit<User, 'followers' | 'following'>;

const withSocialStats = (seed: UserSeed): User => ({
  ...seed,
  followers: followerCount(seed.id),
  following: followingCount(seed.id),
});

export const playerUser: User = withSocialStats({
  id: 'player',
  handle: 'player_one',
  displayName: 'Player One',
  avatar: avatar('player_one'),
  tagline: 'Freelance brand alchemist',
  bio: 'Prototype handler for Voltcore experiments, writing field notes in public.',
  location: 'Neon District',
});

const voltcoreSpokes: User = withSocialStats({
  id: 'voltcore',
  handle: 'voltcore_energy',
  displayName: 'Voltcore Energy',
  avatar: avatar('voltcore_energy'),
  tagline: 'Pure attention in a can.',
  bio: 'Corporate feed for Voltcore and Lucid launches.',
  location: 'Skyline Tower',
});

const rumorBroker: User = withSocialStats({
  id: 'rumor',
  handle: 'wiretap_broker',
  displayName: 'Wiretap Broker',
  avatar: avatar('wiretap_broker'),
  tagline: 'Truth, rumors, assets.',
  bio: 'Broker of whispers, burner ledgers, and panic.',
});

const chemist: User = withSocialStats({
  id: 'chemist',
  handle: 'synth_chemist',
  displayName: 'SynthChem Drip',
  avatar: avatar('synth_chemist'),
  tagline: 'Reverse engineering your caffeine high.',
  bio: 'Publishing every Voltcore teardown until solvent fumes win.',
});

const journalist: User = withSocialStats({
  id: 'journalist',
  handle: 'orbital_press',
  displayName: 'Orbital Press',
  avatar: avatar('orbital_press'),
  tagline: 'Broadcasting from the upper stratos.',
});

const mockUsers: User[] = [playerUser, voltcoreSpokes, rumorBroker, chemist, journalist];

export const mockTimeline: Tweet[] = [
  {
    id: 'tw-1',
    author: voltcoreSpokes,
    content: 'We just shipped Voltcore//Lucid: a drip IV for your ambition. Early trials start tonight in Neon District Sector 7.',
    timestamp: minutesAgo(12),
    likes: 280,
    replies: 2,
    reposts: 58,
  },
  {
    id: 'tw-2',
    author: rumorBroker,
    content: '⚠️ Hearing Voltcore is bribing port inspectors with lifetime stim allotments. Anyone got eyes on Bay 44?',
    timestamp: minutesAgo(24),
    likes: 120,
    replies: 1,
    reposts: 31,
  },
  {
    id: 'tw-3',
    author: chemist,
    content: 'Just cracked an unofficial Lucid vial. Composition looks like caffeine + hypericin analogs + ???. No safety seals.',
    timestamp: minutesAgo(38),
    likes: 96,
    replies: 0,
    reposts: 22,
  },
  {
    id: 'tw-4',
    author: journalist,
    content: 'City Council wants hearings on corporate mood hacking. Voltcore, LuminDyn, and three startup labs are subpoenaed.',
    timestamp: minutesAgo(58),
    likes: 75,
    replies: 0,
    reposts: 18,
  },
  {
    id: 'tw-5',
    author: playerUser,
    content: 'Debating whether to pitch Voltcore on a micro-influencer loyalty loop. Might just build my own rogue promo coop.',
    timestamp: minutesAgo(95),
    likes: 54,
    replies: 0,
    reposts: 12,
  },
];

const mockReplies: Tweet[] = [
  {
    id: 'tw-1-reply-1',
    author: chemist,
    content: 'Just tested Lucid batch #14. Stabilizers are new but still volatile.',
    timestamp: minutesAgo(18),
    likes: 42,
    replies: 0,
    reposts: 3,
    parentId: 'tw-1',
  },
  {
    id: 'tw-1-reply-2',
    author: rumorBroker,
    content: 'Chem auditors are signing whatever Voltcore puts down. Bring receipts.',
    timestamp: minutesAgo(15),
    likes: 39,
    replies: 0,
    reposts: 5,
    parentId: 'tw-1',
  },
  {
    id: 'tw-2-reply-1',
    author: playerUser,
    content: 'Might hijack the port chatter to test my loyalty loop pitch...',
    timestamp: minutesAgo(10),
    likes: 21,
    replies: 0,
    reposts: 2,
    parentId: 'tw-2',
  },
  {
    id: 'tw-1-reply-1a',
    author: rumorBroker,
    content: 'Chemists keep warning Lucid testers and Voltcore keeps turning up the hype.',
    timestamp: minutesAgo(8),
    likes: 12,
    replies: 0,
    reposts: 1,
    parentId: 'tw-1-reply-1',
  },
];

const getPostsByUser = (userId: string) => [...mockTimeline, ...mockReplies].filter((tweet) => tweet.author.id === userId);

export const mockNotifications: NotificationItem[] = [
  {
    id: 'nt-1',
    type: 'reply',
    message: 'Wiretap Broker replied to your Lucid speculation thread.',
    timestamp: minutesAgo(18),
    relatedUser: rumorBroker,
  },
  {
    id: 'nt-2',
    type: 'follow',
    message: 'SynthChem Drip started following you after the teardown.',
    timestamp: minutesAgo(47),
    relatedUser: chemist,
  },
  {
    id: 'nt-3',
    type: 'like',
    message: 'Voltcore Energy liked your loyalty loop pitch.',
    timestamp: minutesAgo(90),
    relatedUser: voltcoreSpokes,
  },
];

export const mockTrendingTopics: TrendTopic[] = [
  {
    id: 'trend-1',
    hashtag: '#LucidTrials',
    posts: 18200,
    description: 'Live coverage from the first Voltcore Lucid accelerators.',
  },
  {
    id: 'trend-2',
    hashtag: '#GreyMarketFuel',
    posts: 12400,
    description: 'Underground chemists racing to copy Voltcore blends.',
  },
  {
    id: 'trend-3',
    hashtag: '#CouncilHearings',
    posts: 7900,
    description: 'Regulators probing neurostimulant lobbying.',
  },
];

const playerPinnedTimelineTweet = mockTimeline.find((tweet) => tweet.id === 'tw-5');

export const mockProfile: ProfileSummary = {
  user: playerUser,
  bio: playerUser.bio ?? 'Prototype handler for Voltcore experiments. Documenting everything.',
  location: playerUser.location ?? 'Neon District',
  stats: {
    followers: followerCount(playerUser.id),
    following: followingCount(playerUser.id),
    posts: getPostsByUser(playerUser.id).length,
  },
  pinnedTweet: playerPinnedTimelineTweet
    ? {
        ...playerPinnedTimelineTweet,
        isPinned: true,
      }
    : undefined,
};

const findTimelineTweet = (id: string) => mockTimeline.find((tweet) => tweet.id === id);

const buildThread = (parentId: string): Tweet[] =>
  mockReplies
    .filter((reply) => reply.parentId === parentId)
    .map((reply) => ({
      ...reply,
      thread: buildThread(reply.id),
    }));

const cloneTweet = (tweet: Tweet): Tweet => ({
  ...tweet,
  thread: tweet.thread?.map(cloneTweet),
});

export const getMockTweetWithThread = (tweetId: string): Tweet | undefined => {
  const baseTweet = findTimelineTweet(tweetId) ?? mockReplies.find((reply) => reply.id === tweetId);
  if (!baseTweet) return undefined;
  return cloneTweet({
    ...baseTweet,
    thread: buildThread(baseTweet.id),
  });
};

export const recordMockLike = (tweetId: string) => {
  const tweet = findTimelineTweet(tweetId) ?? mockReplies.find((reply) => reply.id === tweetId);
  if (tweet) {
    tweet.likes += 1;
  }
};

export const recordMockReply = (parentId: string, reply: Tweet) => {
  const parentTweet = findTimelineTweet(parentId);
  const parentReply = mockReplies.find((existing) => existing.id === parentId);

  mockReplies.push(reply);

  if (parentTweet) {
    parentTweet.replies += 1;
  }
  if (parentReply) {
    parentReply.replies += 1;
  }
};

export const getMockAuthorProfile = (handle: string): AuthorProfile | undefined => {
  const user = mockUsers.find((candidate) => candidate.handle === handle);
  if (!user) {
    return undefined;
  }

  const posts = getPostsByUser(user.id);

  return {
    user,
    bio: user.bio,
    location: user.location,
    stats: {
      followers: followerCount(user.id),
      following: followingCount(user.id),
      posts: posts.length,
    },
    posts,
    viewerIsFollowing: isFollowing(playerUser.id, user.id),
    isViewer: user.id === playerUser.id,
  };
};

const updateMockFollow = (handle: string, action: 'follow' | 'unfollow'): AuthorProfile | undefined => {
  const user = mockUsers.find((candidate) => candidate.handle === handle);
  if (!user || user.id === playerUser.id) {
    return getMockAuthorProfile(handle);
  }

  if (action === 'follow') {
    if (!isFollowing(playerUser.id, user.id)) {
      mockFollowPairs.push({ followerId: playerUser.id, followingId: user.id });
    }
  } else {
    const index = mockFollowPairs.findIndex(
      (pair) => pair.followerId === playerUser.id && pair.followingId === user.id,
    );
    if (index >= 0) {
      mockFollowPairs.splice(index, 1);
    }
  }

  return getMockAuthorProfile(handle);
};

export const followMockAuthor = (handle: string) => updateMockFollow(handle, 'follow');

export const unfollowMockAuthor = (handle: string) => updateMockFollow(handle, 'unfollow');
