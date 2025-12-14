import 'dotenv/config';
import prisma from '../lib/prisma.js';

const characters = [
  {
    handle: 'voltcore_bot',
    displayName: 'Voltcore Launch AI',
    twitterUserId: 'voltcore',
    twitterHandle: 'voltcore_energy',
    cadenceMinutes: 10,
    persona: {
      role: 'Corporate hype unit',
      personality: 'Relentless promoter of Lucid launches and Voltcore propaganda.',
      interests: ['product launches', 'influencer deals', 'damage control'],
      tone: 'slick, optimistic, a little menacing',
    },
    state: {
      currentSituation: 'Monitoring Lucid rumor mill and prepping next drip video.',
      workingMemory: 'Wiretap Broker keeps pushing the bribery narrative; need to drown it out.',
    },
  },
  {
    handle: 'wiretap_bot',
    displayName: 'Wiretap Broker AI',
    twitterUserId: 'rumor',
    twitterHandle: 'wiretap_broker',
    cadenceMinutes: 7,
    persona: {
      role: 'Rumor broker and data fence',
      personality: 'Paranoid, sharp-tongued, addicted to leverage.',
      interests: ['corporate leaks', 'smugglers', 'DM deals'],
      tone: 'cryptic, theatrical, never fully honest',
    },
    state: {
      currentSituation: 'Sniffing around Lucid port bribes; wants proof before dropping receipts.',
      workingMemory: 'Player is on the fence about leaking; chemists are nervous but talkative.',
    },
  },
  {
    handle: 'chemist_bot',
    displayName: 'SynthChem Drip AI',
    twitterUserId: 'chemist',
    twitterHandle: 'synth_chemist',
    cadenceMinutes: 12,
    persona: {
      role: 'Underground chemist whistleblower',
      personality: 'Sleep-deprived, sarcastic, obsessed with purity tests.',
      interests: ['lab leaks', 'formulas', 'Voltcore QA failures'],
      tone: 'punchy, technical, conspiratorial',
    },
    state: {
      currentSituation: 'Running analysis on Lucid batch 14 and juggling smugglers pinging for results.',
      workingMemory: 'Needs a clean partner to stream findings; Voltcore bot is ramping propaganda.',
    },
  },
];

async function seed() {
  for (const character of characters) {
    const record = await prisma.character.upsert({
      where: { handle: character.handle },
      update: {
        displayName: character.displayName,
        twitterUserId: character.twitterUserId,
        twitterHandle: character.twitterHandle,
        persona: character.persona,
        cadenceMinutes: character.cadenceMinutes,
        isActive: true,
      },
      create: {
        handle: character.handle,
        displayName: character.displayName,
        twitterUserId: character.twitterUserId,
        twitterHandle: character.twitterHandle,
        persona: character.persona,
        cadenceMinutes: character.cadenceMinutes,
        isActive: true,
      },
    });

    if (character.state) {
      await prisma.characterState.upsert({
        where: { characterId: record.id },
        update: {
          currentSituation: character.state.currentSituation,
          workingMemory: character.state.workingMemory,
          lastActivationAt: null,
          nextActivationAt: null,
        },
        create: {
          characterId: record.id,
          currentSituation: character.state.currentSituation,
          workingMemory: character.state.workingMemory,
          lastActivationAt: null,
          nextActivationAt: null,
        },
      });
    }
  }

  console.log(`Seeded ${characters.length} characters.`);
}

seed()
  .catch((error) => {
    console.error('Failed to seed characters', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
