import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { fetchProfile, fetchTimeline } from './twitterClient.js';
import { ActivationBundle, Persona } from '../types.js';

const parsePersona = (payload: unknown): Persona => {
  if (typeof payload === 'object' && payload !== null) {
    const { role = '', personality = '', interests = [], tone } = payload as Record<string, unknown>;
    return {
      role: String(role ?? ''),
      personality: String(personality ?? ''),
      interests: Array.isArray(interests) ? (interests as unknown[]).map((item) => String(item)) : [],
      tone: tone ? String(tone) : undefined,
    };
  }
  return { role: '', personality: '', interests: [] };
};

export const getActivationBundle = async (characterId: string): Promise<ActivationBundle> => {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { state: true },
  });

  if (!character) {
    throw new Error('Character not found');
  }

  const [feed, profile] = await Promise.all([
    fetchTimeline(character.twitterHandle),
    fetchProfile(character.twitterHandle),
  ]);

  return {
    characterId: character.id,
    handle: character.twitterHandle,
    persona: parsePersona(character.persona),
    state: {
      currentSituation: character.state?.currentSituation,
      workingMemory: character.state?.workingMemory,
      lastActivationAt: character.state?.lastActivationAt?.toISOString() ?? null,
    },
    feed,
    profile,
  };
};

export const recordActivation = async (
  characterId: string,
  data: {
    state?: { currentSituation?: string | null; workingMemory?: string | null; nextActivationAt?: string | null };
    actions?: unknown;
    summary?: string;
    inputContext?: unknown;
    inputBundle?: unknown;
  },
) => {
  const character = await prisma.character.findUnique({ where: { id: characterId }, include: { state: true } });
  if (!character) {
    throw new Error('Character not found');
  }

  const stateUpdate = data.state
    ? {
        currentSituation: data.state.currentSituation ?? character.state?.currentSituation ?? null,
        workingMemory: data.state.workingMemory ?? character.state?.workingMemory ?? null,
        nextActivationAt: data.state.nextActivationAt ? new Date(data.state.nextActivationAt) : character.state?.nextActivationAt ?? null,
        lastActivationAt: new Date(),
      }
    : undefined;

  await prisma.$transaction(async (tx) => {
    if (stateUpdate) {
      if (character.state) {
        await tx.characterState.update({ where: { id: character.state.id }, data: stateUpdate });
      } else {
        await tx.characterState.create({
          data: {
            characterId: character.id,
            ...stateUpdate,
          },
        });
      }
    }

    const actionsPayload =
      data.actions === undefined ? undefined : (data.actions as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput);

    await tx.characterActivation.create({
      data: {
        characterId: character.id,
        actions: actionsPayload,
        summary: data.summary,
        inputContext: data.inputContext as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
        inputBundle: data.inputBundle as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
      },
    });
  });
};
