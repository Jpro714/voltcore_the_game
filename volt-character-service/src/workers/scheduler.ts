import 'dotenv/config';
import prisma from '../lib/prisma.js';
import { getActivationBundle, recordActivation } from '../services/activationService.js';
import { getLLMProvider } from '../services/llmProvider.js';
import { executeActions } from '../services/actionExecutor.js';

const DEFAULT_CADENCE_MINUTES = 10;
const llmProvider = getLLMProvider();

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

  const decision = await llmProvider.generateActivation(bundle);
  const actionResults = await executeActions(character.twitterHandle, decision.actions ?? []);
  const cadenceMinutes = decision.nextActivationMinutes ?? character.cadenceMinutes ?? DEFAULT_CADENCE_MINUTES;
  const nextActivationAt = cadenceMinutes ? new Date(Date.now() + cadenceMinutes * 60 * 1000).toISOString() : null;

  await recordActivation(character.id, {
    summary: decision.summary,
    actions: actionResults,
    state: {
      currentSituation: decision.currentSituation ?? bundle.state.currentSituation ?? null,
      workingMemory: decision.workingMemory ?? bundle.state.workingMemory ?? null,
      nextActivationAt,
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
