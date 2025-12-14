import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);
const avatar = (seed: string) => `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;

const users = [
  {
    id: 'player',
    handle: 'player_one',
    displayName: 'Player One',
    avatar: avatar('player_one'),
    tagline: 'Freelance brand alchemist',
  },
  {
    id: 'voltcore',
    handle: 'voltcore_energy',
    displayName: 'Voltcore Energy',
    avatar: avatar('voltcore_energy'),
    tagline: 'Pure attention in a can.',
  },
  {
    id: 'rumor',
    handle: 'wiretap_broker',
    displayName: 'Wiretap Broker',
    avatar: avatar('wiretap_broker'),
    tagline: 'Truth, rumors, assets.',
  },
  {
    id: 'chemist',
    handle: 'synth_chemist',
    displayName: 'SynthChem Drip',
    avatar: avatar('synth_chemist'),
    tagline: 'Reverse engineering your caffeine high.',
  },
  {
    id: 'journalist',
    handle: 'orbital_press',
    displayName: 'Orbital Press',
    avatar: avatar('orbital_press'),
    tagline: 'Broadcasting from the upper stratos.',
  },
];

const basePosts = [
  {
    id: 'tw-1',
    authorId: 'voltcore',
    content: 'We just shipped Voltcore//Lucid: a drip IV for your ambition. Early trials start tonight in Neon District Sector 7.',
    createdAt: minutesAgo(22),
    likes: 280,
    replies: 2,
    reposts: 58,
    isPinned: false,
  },
  {
    id: 'tw-2',
    authorId: 'rumor',
    content: '⚠️ Hearing Voltcore is bribing port inspectors with lifetime stim allotments. Anyone got eyes on Bay 44?',
    createdAt: minutesAgo(48),
    likes: 120,
    replies: 1,
    reposts: 31,
    isPinned: false,
  },
  {
    id: 'tw-3',
    authorId: 'chemist',
    content: 'Just cracked an unofficial Lucid vial. Composition looks like caffeine + hypericin analogs + ???. No safety seals.',
    createdAt: minutesAgo(38),
    likes: 96,
    replies: 0,
    reposts: 22,
    isPinned: false,
  },
  {
    id: 'tw-4',
    authorId: 'journalist',
    content: 'City Council wants hearings on corporate mood hacking. Voltcore, LuminDyn, and three startup labs are subpoenaed.',
    createdAt: minutesAgo(58),
    likes: 75,
    replies: 0,
    reposts: 18,
    isPinned: false,
  },
  {
    id: 'tw-5',
    authorId: 'player',
    content: 'Debating whether to pitch Voltcore on a micro-influencer loyalty loop. Might just build my own rogue promo coop.',
    createdAt: minutesAgo(95),
    likes: 54,
    replies: 0,
    reposts: 12,
    isPinned: true,
  },
];

const replyPosts = [
  {
    id: 'tw-1-reply-1',
    authorId: 'chemist',
    content: 'Just tested Lucid batch #14. Seeing stabilizers but the solvent ratios are still sketchy.',
    createdAt: minutesAgo(18),
    likes: 42,
    replies: 0,
    reposts: 3,
    isPinned: false,
    parentPostId: 'tw-1',
  },
  {
    id: 'tw-1-reply-2',
    authorId: 'rumor',
    content: 'Hearing Voltcore is bribing chem auditors to sign off on whatever the Lucid team ships.',
    createdAt: minutesAgo(16),
    likes: 39,
    replies: 0,
    reposts: 5,
    isPinned: false,
    parentPostId: 'tw-1',
  },
  {
    id: 'tw-5-reply-1',
    authorId: 'player',
    content: 'Might pilot the loyalty loop with chemists + smugglers first and see if Voltcore notices.',
    createdAt: minutesAgo(40),
    likes: 21,
    replies: 0,
    reposts: 2,
    isPinned: false,
    parentPostId: 'tw-2',
  },
];

const posts = [...basePosts, ...replyPosts];

const notifications = [
  {
    id: 'nt-1',
    type: 'reply' as const,
    message: 'Wiretap Broker replied to your Lucid speculation thread.',
    createdAt: minutesAgo(18),
    relatedUserId: 'rumor',
  },
  {
    id: 'nt-2',
    type: 'follow' as const,
    message: 'SynthChem Drip started following you after the teardown.',
    createdAt: minutesAgo(47),
    relatedUserId: 'chemist',
  },
  {
    id: 'nt-3',
    type: 'like' as const,
    message: 'Voltcore Energy liked your loyalty loop pitch.',
    createdAt: minutesAgo(90),
    relatedUserId: 'voltcore',
  },
];

const trendingTopics = [
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

const seed = async () => {
  await prisma.notification.deleteMany();
  await prisma.trendingTopic.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({ data: users });
  await prisma.post.createMany({ data: posts });
  await prisma.notification.createMany({ data: notifications });
  await prisma.trendingTopic.createMany({ data: trendingTopics });

  await prisma.profile.create({
    data: {
      id: 'profile-player',
      userId: 'player',
      bio: 'Prototype handler for Voltcore experiments. Documenting everything.',
      location: 'Neon District',
      followers: 1580,
      following: 403,
      posts: posts.filter((post) => post.authorId === 'player').length,
      pinnedPostId: 'tw-5',
    },
  });

  console.log('Database seeded with demo data.');
};

seed()
  .catch((error) => {
    console.error('Failed to seed database', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
