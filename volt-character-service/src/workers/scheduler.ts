import 'dotenv/config';
import prisma from '../lib/prisma.js';
import { runCharacterActivation } from '../services/activationRunner.js';

async function runOnce() {
  const now = new Date();
  const characters = await prisma.character.findMany({
    where: {
      isActive: true,
      OR: [
        { state: { nextActivationAt: { lte: now } } },
        { state: null },
      ],
    },
    take: 1,
  });

  if (characters.length === 0) {
    console.log('No characters ready for activation.');
    return;
  }

  const character = characters[0];
  console.log(`Running activation for ${character.twitterHandle}`);
  await runCharacterActivation(character.id);
}

runOnce()
  .catch((error) => {
    console.error('Worker execution failed', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
