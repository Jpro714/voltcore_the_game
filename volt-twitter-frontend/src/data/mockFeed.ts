import { NotificationItem, ProfileSummary, TrendTopic, Tweet, User } from '../types/feed';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

const avatar = (seed: string) => `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;

export const playerUser: User = {
  id: 'player',
  handle: 'player_one',
  displayName: 'Player One',
  avatar: avatar('player_one'),
  tagline: 'Freelance brand alchemist',
};

const voltcoreSpokes: User = {
  id: 'voltcore',
  handle: 'voltcore_energy',
  displayName: 'Voltcore Energy',
  avatar: avatar('voltcore_energy'),
  tagline: 'Pure attention in a can.',
};

const rumorBroker: User = {
  id: 'rumor',
  handle: 'wiretap_broker',
  displayName: 'Wiretap Broker',
  avatar: avatar('wiretap_broker'),
  tagline: 'Truth, rumors, assets.',
};

const chemist: User = {
  id: 'chemist',
  handle: 'synth_chemist',
  displayName: 'SynthChem Drip',
  avatar: avatar('synth_chemist'),
  tagline: 'Reverse engineering your caffeine high.',
};

const journalist: User = {
  id: 'journalist',
  handle: 'orbital_press',
  displayName: 'Orbital Press',
  avatar: avatar('orbital_press'),
  tagline: 'Broadcasting from the upper stratos.',
};

export const mockTimeline: Tweet[] = [
  {
    id: 'tw-1',
    author: voltcoreSpokes,
    content: 'We just shipped Voltcore//Lucid: a drip IV for your ambition. Early trials start tonight in Neon District Sector 7.',
    timestamp: minutesAgo(12),
    likes: 890,
    replies: 312,
    reposts: 204,
  },
  {
    id: 'tw-2',
    author: rumorBroker,
    content: '⚠️ Hearing Voltcore is bribing port inspectors with lifetime stim allotments. Anyone got eyes on Bay 44?',
    timestamp: minutesAgo(24),
    likes: 420,
    replies: 201,
    reposts: 159,
  },
  {
    id: 'tw-3',
    author: chemist,
    content: 'Just cracked an unofficial Lucid vial. Composition looks like caffeine + hypericin analogs + ???. No safety seals.',
    timestamp: minutesAgo(38),
    likes: 318,
    replies: 87,
    reposts: 121,
  },
  {
    id: 'tw-4',
    author: journalist,
    content: 'City Council wants hearings on corporate mood hacking. Voltcore, LuminDyn, and three startup labs are subpoenaed.',
    timestamp: minutesAgo(58),
    likes: 189,
    replies: 43,
    reposts: 80,
  },
  {
    id: 'tw-5',
    author: playerUser,
    content: 'Debating whether to pitch Voltcore on a micro-influencer loyalty loop. Might just build my own rogue promo coop.',
    timestamp: minutesAgo(95),
    likes: 66,
    replies: 12,
    reposts: 9,
  },
];

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

export const mockProfile: ProfileSummary = {
  user: playerUser,
  bio: 'Prototype handler for Voltcore experiments. Documenting everything.',
  location: 'Neon District',
  stats: {
    followers: 1580,
    following: 403,
    posts: 312,
  },
  pinnedTweet: {
    id: 'tw-pinned',
    author: playerUser,
    content: 'Thread: How to hijack a megacorp launch with 5 collaborators and an unstable meme.',
    timestamp: minutesAgo(1200),
    likes: 1220,
    replies: 441,
    reposts: 390,
    isPinned: true,
  },
};
