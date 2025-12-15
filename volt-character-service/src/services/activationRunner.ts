import prisma from '../lib/prisma.js';
import { getActivationBundle, recordActivation } from './activationService.js';
import { getLLMProvider } from './llmProvider.js';
import { executeActions } from './actionExecutor.js';

const DEFAULT_CADENCE_MINUTES = Number(process.env.CHARACTER_DEFAULT_CADENCE ?? 10);
const provider = getLLMProvider();

export const runCharacterActivation = async (characterId: string) => {
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) {
    throw new Error('Character not found');
  }

  const bundle = await getActivationBundle(characterId);
  const decision = await provider.generateActivation(bundle);
  const actionResults = await executeActions(character.twitterHandle, decision.actions ?? []);

  const cadenceMinutes = decision.nextActivationMinutes ?? character.cadenceMinutes ?? DEFAULT_CADENCE_MINUTES;
  const nextActivationAt = cadenceMinutes ? new Date(Date.now() + cadenceMinutes * 60 * 1000).toISOString() : null;

  await recordActivation(characterId, {
    summary: decision.summary,
    actions: actionResults,
    state: {
      currentSituation: decision.currentSituation ?? bundle.state.currentSituation ?? null,
      workingMemory: decision.workingMemory ?? bundle.state.workingMemory ?? null,
      nextActivationAt,
    },
  });

  return {
    summary: decision.summary,
    actions: actionResults,
  };
};
