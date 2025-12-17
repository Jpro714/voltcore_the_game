import { Router } from 'express';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { WalletType } from '@prisma/client';
import { asyncHandler } from '../lib/asyncHandler';
import { decimalInput } from '../lib/validation';
import { walletService } from '../services/walletService';

const walletsRouter = Router();

const createSchema = z.object({
  displayName: z.string().min(3).max(80),
  handle: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, 'Handle can only contain letters, numbers, and underscores')
    .optional(),
  type: z.nativeEnum(WalletType).optional(),
  initialCredBalance: decimalInput.default(new Decimal(0)),
});

const walletIdParams = z.object({ walletId: z.string().cuid() });

const fundSchema = z.object({ amount: decimalInput });

walletsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const wallets = await walletService.list();
    res.json(wallets);
  }),
);

walletsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createSchema.parse(req.body);
    const wallet = await walletService.create({
      displayName: payload.displayName,
      handle: payload.handle,
      type: payload.type,
      initialCredBalance: payload.initialCredBalance,
    });
    res.status(201).json(wallet);
  }),
);

walletsRouter.post(
  '/:walletId/fund',
  asyncHandler(async (req, res) => {
    const { walletId } = walletIdParams.parse(req.params);
    const payload = fundSchema.parse(req.body);
    const wallet = await walletService.fund(walletId, payload.amount);
    res.json(wallet);
  }),
);

export { walletsRouter };
