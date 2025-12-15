import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { getActivationBundle, recordActivation } from '../services/activationService.js';
import { runCharacterActivation } from '../services/activationRunner.js';
import { enqueuePingForHandle } from '../services/pingService.js';

const router = Router();

router.get('/', async (_req, res) => {
  const characters = await prisma.character.findMany({
    include: { state: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(characters);
});

router.post('/', async (req, res) => {
  const { handle, displayName, twitterUserId, twitterHandle, persona, cadenceMinMinutes, cadenceMaxMinutes } = req.body;
  if (!handle || !displayName || !twitterUserId || !twitterHandle) {
    return res.status(400).json({ message: 'handle, displayName, twitterUserId, and twitterHandle are required' });
  }
  const min = Number.isFinite(cadenceMinMinutes) ? Number(cadenceMinMinutes) : 5;
  const max = Number.isFinite(cadenceMaxMinutes) ? Number(cadenceMaxMinutes) : 15;
  if (min <= 0 || max <= 0 || min > max) {
    return res.status(400).json({ message: 'cadence values must be positive and min <= max' });
  }

  const character = await prisma.character.create({
    data: {
      handle,
      displayName,
      twitterUserId,
      twitterHandle,
      persona: persona ?? {},
      cadenceMinMinutes: min,
      cadenceMaxMinutes: max,
    },
  });
  res.status(201).json(character);
});

router.put('/:id', async (req, res) => {
  const { cadenceMinMinutes, cadenceMaxMinutes, isActive } = req.body ?? {};
  const character = await prisma.character.findUnique({ where: { id: req.params.id } });
  if (!character) {
    return res.status(404).json({ message: 'Character not found' });
  }

  let min = character.cadenceMinMinutes ?? 5;
  let max = character.cadenceMaxMinutes ?? 15;
  if (cadenceMinMinutes !== undefined) {
    min = Number(cadenceMinMinutes);
  }
  if (cadenceMaxMinutes !== undefined) {
    max = Number(cadenceMaxMinutes);
  }
  if (min <= 0 || max <= 0 || min > max) {
    return res.status(400).json({ message: 'cadence values must be positive and min <= max' });
  }

  const update = await prisma.character.update({
    where: { id: character.id },
    data: {
      cadenceMinMinutes: min,
      cadenceMaxMinutes: max,
      isActive: typeof isActive === 'boolean' ? isActive : character.isActive,
    },
  });

  res.json(update);
});

router.post('/pings', async (req, res) => {
  const { handle, type, payload } = req.body ?? {};
  if (!handle || !type) {
    return res.status(400).json({ message: 'handle and type are required' });
  }
  const success = await enqueuePingForHandle(handle, type, payload ?? {});
  if (!success) {
    return res.status(404).json({ message: 'Character not found for handle' });
  }
  res.status(204).send();
});

router.get('/:id', async (req, res) => {
  const character = await prisma.character.findUnique({ where: { id: req.params.id }, include: { state: true } });
  if (!character) {
    return res.status(404).json({ message: 'Character not found' });
  }
  res.json(character);
});

router.get('/:id/activations', async (req, res) => {
  const limit = Number(req.query.limit) || 5;
  const activations = await prisma.characterActivation.findMany({
    where: { characterId: req.params.id },
    orderBy: { occurredAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 25),
  });

  if (activations.length === 0) {
    const exists = await prisma.character.count({ where: { id: req.params.id } });
    if (exists === 0) {
      return res.status(404).json({ message: 'Character not found' });
    }
  }

  res.json(
    activations.map((entry) => ({
      id: entry.id,
      occurredAt: entry.occurredAt,
      summary: entry.summary,
      actions: entry.actions,
      inputContext: entry.inputContext,
      inputBundle: entry.inputBundle,
    })),
  );
});

router.put('/:id/state', async (req, res) => {
  const { currentSituation, workingMemory, nextActivationAt } = req.body ?? {};
  const character = await prisma.character.findUnique({ where: { id: req.params.id }, include: { state: true } });
  if (!character) {
    return res.status(404).json({ message: 'Character not found' });
  }

  const payload = {
    currentSituation: currentSituation ?? null,
    workingMemory: workingMemory ?? null,
    nextActivationAt: nextActivationAt ? new Date(nextActivationAt) : null,
  };

  const state = character.state
    ? await prisma.characterState.update({ where: { id: character.state.id }, data: payload })
    : await prisma.characterState.create({ data: { characterId: character.id, ...payload } });

  res.json(state);
});

router.post('/:id/activation/request', async (req, res) => {
  try {
    const bundle = await getActivationBundle(req.params.id);
    res.json(bundle);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

router.post('/:id/activation/commit', async (req, res) => {
  try {
    await recordActivation(req.params.id, req.body ?? {});
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

router.post('/:id/activation/run', async (req, res) => {
  try {
    const result = await runCharacterActivation(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
});

export default router;
