import 'dotenv/config';
import prisma from '../lib/prisma.js';
import { getActivationBundle, recordActivation } from '../services/activationService.js';

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
  const bundle = await getActivationBundle(character.id);
  console.log(`Fetched activation bundle for ${bundle.handle}`);

  await recordActivation(character.id, {
    summary: 'placeholder activation - actions not yet implemented',
    state: {
      currentSituation: bundle.state.currentSituation ?? null,
      workingMemory: bundle.state.workingMemory ?? null,
      nextActivationAt: character.cadenceMinutes
        ? new Date(Date.now() + character.cadenceMinutes * 60 * 1000).toISOString()
        : null,
    },
  });
}

runOnce()
  .catch((error) => {
    console.error('Worker execution failed', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
