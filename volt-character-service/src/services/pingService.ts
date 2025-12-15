import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { PingContext } from '../types.js';

export type PingType = 'mention' | 'dm' | 'reply';

export const enqueuePingForHandle = async (handle: string, type: PingType, payload: Record<string, unknown>) => {
  const normalized = handle.replace(/^@/, '');
  const character = await prisma.character.findFirst({
    where: {
      twitterHandle: {
        equals: normalized,
        mode: 'insensitive',
      },
    },
    select: { id: true, twitterHandle: true },
  });

  if (!character) {
    console.warn(`[ping] No active character found for handle ${normalized}`);
    return false;
  }

  await prisma.characterPing.create({
    data: {
      characterId: character.id,
      type,
      payload: payload as Prisma.InputJsonValue,
    },
  });
  console.log(`[ping] Queued ${type} ping for @${character.twitterHandle}`);

  return true;
};

export const fetchNextPing = () =>
  prisma.characterPing.findFirst({
    where: {
      consumedAt: null,
      character: { isActive: true },
    },
    include: { character: true },
    orderBy: { createdAt: 'asc' },
  });

export const markPingConsumed = (id: string) =>
  prisma.characterPing.update({
    where: { id },
    data: { consumedAt: new Date() },
  });

export const buildPingContext = (ping: { type: string; payload: unknown }): PingContext => {
  let payload: Record<string, unknown> = {};
  if (ping.payload && typeof ping.payload === 'object') {
    payload = ping.payload as Record<string, unknown>;
  }

  return {
    type: ping.type as PingType,
    payload,
  };
};
