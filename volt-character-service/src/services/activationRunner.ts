import prisma from '../lib/prisma.js';
import { recordActivation } from './activationService.js';
import { getLLMProvider } from './llmProvider.js';
import { executeActions } from './actionExecutor.js';
import { PingContext } from '../types.js';
import { createActivationContext } from './contextBuilder.js';

const DEFAULT_CADENCE_MIN = Number(process.env.CHARACTER_MIN_CADENCE ?? 5);
const DEFAULT_CADENCE_MAX = Number(process.env.CHARACTER_MAX_CADENCE ?? 15);
const provider = getLLMProvider();

interface ActivationOptions {
  ping?: PingContext;
}

const pickRandomCadence = (min: number, max: number) => {
  if (min >= max) {
    return min;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const runCharacterActivation = async (characterId: string, options: ActivationOptions = {}) => {
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) {
    throw new Error('Character not found');
  }

  const bundle = await createActivationContext(characterId, options.ping);

  const decision = await provider.generateActivation(bundle);
  const actionResults = await executeActions(character.twitterHandle, decision.actions ?? []);

  const cadenceMin = character.cadenceMinMinutes ?? DEFAULT_CADENCE_MIN;
  const cadenceMax = character.cadenceMaxMinutes ?? DEFAULT_CADENCE_MAX;
  const randomCadence = pickRandomCadence(cadenceMin, cadenceMax);
  const cadenceMinutes = decision.nextActivationMinutes ?? randomCadence;
  const nextActivationAt = cadenceMinutes ? new Date(Date.now() + cadenceMinutes * 60 * 1000).toISOString() : null;

  await recordActivation(characterId, {
    summary: decision.summary,
    actions: actionResults,
    inputContext: options.ping ? { ping: options.ping } : undefined,
    inputBundle: bundle,
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
