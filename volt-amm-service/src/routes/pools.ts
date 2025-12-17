import { Router } from 'express';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { config } from '../config';
import { asyncHandler } from '../lib/asyncHandler';
import { decimalInput } from '../lib/validation';
import { ammService } from '../services/ammService';

const poolsRouter = Router();

const poolIdParams = z.object({ poolId: z.string().cuid() });

const createPoolSchema = z.object({
  symbol: z
    .string()
    .min(2)
    .max(8)
    .regex(/^[A-Z0-9]+$/i, 'Symbol must be alphanumeric'),
  name: z.string().min(3).max(80),
  description: z.string().max(280).optional(),
  creatorWalletId: z.string().cuid(),
  totalSupply: decimalInput.default(new Decimal(1_000_000)),
  initialCredLiquidity: decimalInput,
  initialTokenLiquidity: decimalInput,
  feeBasisPoints: z.coerce.number().int().min(1).max(1000).optional(),
});

const buySchema = z.object({
  walletId: z.string().cuid(),
  credAmount: decimalInput,
});

const sellSchema = z.object({
  walletId: z.string().cuid(),
  tokenAmount: decimalInput,
});

const addLiquiditySchema = z.object({
  walletId: z.string().cuid(),
  credAmount: decimalInput,
  tokenAmount: decimalInput,
});

const removeLiquiditySchema = z.object({
  walletId: z.string().cuid(),
  shares: decimalInput,
});

const tradeQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

poolsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const pools = await ammService.listPools();
    res.json(pools);
  }),
);

poolsRouter.get(
  '/:poolId',
  asyncHandler(async (req, res) => {
    const { poolId } = poolIdParams.parse(req.params);
    const pool = await ammService.getPool(poolId);
    res.json(pool);
  }),
);

poolsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createPoolSchema.parse(req.body);
    const pool = await ammService.createPool({
      symbol: payload.symbol,
      name: payload.name,
      description: payload.description,
      creatorWalletId: payload.creatorWalletId,
      totalSupply: payload.totalSupply,
      initialCredLiquidity: payload.initialCredLiquidity,
      initialTokenLiquidity: payload.initialTokenLiquidity,
      feeBasisPoints: payload.feeBasisPoints ?? config.defaultTradeFeeBps,
    });
    res.status(201).json(pool);
  }),
);

poolsRouter.post(
  '/:poolId/buy',
  asyncHandler(async (req, res) => {
    const { poolId } = poolIdParams.parse(req.params);
    const payload = buySchema.parse(req.body);
    const result = await ammService.buyTokens({
      poolId,
      walletId: payload.walletId,
      credAmount: payload.credAmount,
    });
    res.json(result);
  }),
);

poolsRouter.post(
  '/:poolId/sell',
  asyncHandler(async (req, res) => {
    const { poolId } = poolIdParams.parse(req.params);
    const payload = sellSchema.parse(req.body);
    const result = await ammService.sellTokens({
      poolId,
      walletId: payload.walletId,
      tokenAmount: payload.tokenAmount,
    });
    res.json(result);
  }),
);

poolsRouter.post(
  '/:poolId/liquidity/add',
  asyncHandler(async (req, res) => {
    const { poolId } = poolIdParams.parse(req.params);
    const payload = addLiquiditySchema.parse(req.body);
    const result = await ammService.addLiquidity({
      poolId,
      walletId: payload.walletId,
      credAmount: payload.credAmount,
      tokenAmount: payload.tokenAmount,
    });
    res.json(result);
  }),
);

poolsRouter.post(
  '/:poolId/liquidity/remove',
  asyncHandler(async (req, res) => {
    const { poolId } = poolIdParams.parse(req.params);
    const payload = removeLiquiditySchema.parse(req.body);
    const result = await ammService.removeLiquidity({
      poolId,
      walletId: payload.walletId,
      shares: payload.shares,
    });
    res.json(result);
  }),
);

poolsRouter.get(
  '/:poolId/trades',
  asyncHandler(async (req, res) => {
    const { poolId } = poolIdParams.parse(req.params);
    const query = tradeQuerySchema.parse(req.query);
    const trades = await ammService.listTrades(poolId, query.limit ?? 50);
    res.json(trades);
  }),
);

export { poolsRouter };
