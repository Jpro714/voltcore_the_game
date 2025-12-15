import 'dotenv/config';
import prisma from '../lib/prisma.js';
import { runCharacterActivation } from '../services/activationRunner.js';
import { buildPingContext, fetchNextPing, markPingConsumed } from '../services/pingService.js';

const IDLE_DELAY_MS = Number(process.env.SCHEDULER_IDLE_DELAY_MS ?? 1000);
const ERROR_DELAY_MS = Number(process.env.SCHEDULER_ERROR_DELAY_MS ?? 2000);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function processNextJob() {
  const pendingPing = await fetchNextPing();
  if (pendingPing) {
    console.log(`Running ping activation for ${pendingPing.character.twitterHandle}`);
    const pingContext = buildPingContext({ type: pendingPing.type, payload: pendingPing.payload });
    try {
      await runCharacterActivation(pendingPing.characterId, { ping: pingContext });
    } catch (error) {
      console.error('Ping activation failed', error);
    } finally {
      await markPingConsumed(pendingPing.id);
    }
    return true;
  }

  const now = new Date();
  const characters = await prisma.character.findMany({
    where: {
      isActive: true,
      OR: [{ state: { nextActivationAt: { lte: now } } }, { state: null }],
    },
    orderBy: { updatedAt: 'asc' },
    take: 1,
  });

  if (characters.length === 0) {
    return false;
  }

  const character = characters[0];
  console.log(`Running activation for ${character.twitterHandle}`);
  await runCharacterActivation(character.id);
  return true;
}

async function runLoop() {
  console.log('Scheduler started. Press Ctrl+C to stop.');
  while (true) {
    try {
      const ranJob = await processNextJob();
      if (!ranJob) {
        console.log('No characters ready for activation.');
        await delay(IDLE_DELAY_MS);
      }
    } catch (error) {
      console.error('Worker execution failed', error);
      await delay(ERROR_DELAY_MS);
    }
  }
}

runLoop().finally(async () => {
  await prisma.$disconnect();
});
