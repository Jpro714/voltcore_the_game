import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { AppError } from '../errors';
import {
  calculateSharesForDeposit,
  calculateWithdrawalForShares,
  computeBuyTrade,
  computeSellTrade,
  toDecimal,
} from '../lib/ammMath';
import { prisma } from '../prisma';

const decimal = (value: Decimal.Value) => new Decimal(value);

const ensurePositive = (value: Decimal, message: string) => {
  if (value.lte(0)) {
    throw new AppError(message);
  }
};

const formatPool = (pool: PoolWithToken) => {
  const credReserve = decimal(pool.credReserve);
  const tokenReserve = decimal(pool.tokenReserve);
  const spotPrice = tokenReserve.eq(0) ? null : credReserve.div(tokenReserve);

  return {
    id: pool.id,
    feeBasisPoints: pool.feeBasisPoints,
    reserves: {
      cred: credReserve.toString(),
      token: tokenReserve.toString(),
    },
    totalShares: decimal(pool.totalShares).toString(),
    ventureToken: {
      id: pool.ventureToken.id,
      symbol: pool.ventureToken.symbol,
      name: pool.ventureToken.name,
      description: pool.ventureToken.description,
      totalSupply: decimal(pool.ventureToken.totalSupply).toString(),
      circulatingSupply: decimal(pool.ventureToken.circulatingSupply).toString(),
    },
    spotPrice: spotPrice ? spotPrice.toString() : null,
    updatedAt: pool.updatedAt,
  };
};

type PoolWithToken = Prisma.LiquidityPoolGetPayload<{
  include: { ventureToken: true };
}>;

const getPoolById = async (poolId: string) => {
  const pool = await prisma.liquidityPool.findUnique({
    where: { id: poolId },
    include: { ventureToken: true },
  });

  if (!pool) {
    throw new AppError('Pool not found', 404);
  }

  return pool;
};

const getWallet = async (walletId: string) => {
  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) throw new AppError('Wallet not found', 404);
  return wallet;
};

type DbClient = Prisma.TransactionClient | typeof prisma;

const getHolding = async (walletId: string, tokenId: string, client: DbClient = prisma) => {
  return client.tokenHolding.findUnique({
    where: { walletId_tokenId: { walletId, tokenId } },
  });
};

export const ammService = {
  async listPools() {
    const pools = await prisma.liquidityPool.findMany({
      include: { ventureToken: true },
      orderBy: { createdAt: 'desc' },
    });
    return pools.map(formatPool);
  },

  async getPool(poolId: string) {
    const pool = await getPoolById(poolId);
    return formatPool(pool);
  },

  async createPool(input: {
    symbol: string;
    name: string;
    description?: string;
    creatorWalletId: string;
    totalSupply: Decimal;
    initialCredLiquidity: Decimal;
    initialTokenLiquidity: Decimal;
    feeBasisPoints: number;
  }) {
    ensurePositive(input.initialCredLiquidity, 'Initial CRED liquidity must be positive');
    ensurePositive(input.initialTokenLiquidity, 'Initial token liquidity must be positive');
    if (input.initialTokenLiquidity.gt(input.totalSupply)) {
      throw new AppError('Initial liquidity cannot exceed total supply');
    }

    const wallet = await getWallet(input.creatorWalletId);
    const walletCred = decimal(wallet.credBalance);
    if (walletCred.lt(input.initialCredLiquidity)) {
      throw new AppError('Wallet does not have enough CRED for seeding liquidity');
    }

    return prisma.$transaction(async (tx) => {
      const token = await tx.ventureToken.create({
        data: {
          symbol: input.symbol.toUpperCase(),
          name: input.name,
          description: input.description,
          totalSupply: input.totalSupply.toString(),
          circulatingSupply: input.totalSupply.toString(),
          creatorWalletId: wallet.id,
        },
      });

      await tx.tokenHolding.create({
        data: {
          walletId: wallet.id,
          tokenId: token.id,
          amount: input.totalSupply.toString(),
        },
      });

      const createdPool = await tx.liquidityPool.create({
        data: {
          ventureTokenId: token.id,
          credReserve: input.initialCredLiquidity.toString(),
          tokenReserve: input.initialTokenLiquidity.toString(),
          totalShares: calculateSharesForDeposit(
            input.initialCredLiquidity,
            input.initialTokenLiquidity,
            decimal(0),
            decimal(0),
            decimal(0),
          ).toString(),
          feeBasisPoints: input.feeBasisPoints,
        },
        include: { ventureToken: true },
      });

      const shares = decimal(createdPool.totalShares);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          credBalance: {
            decrement: input.initialCredLiquidity.toString(),
          },
        },
      });

      await tx.tokenHolding.update({
        where: { walletId_tokenId: { walletId: wallet.id, tokenId: token.id } },
        data: {
          amount: {
            decrement: input.initialTokenLiquidity.toString(),
          },
        },
      });

      await tx.liquidityPosition.create({
        data: {
          poolId: createdPool.id,
          walletId: wallet.id,
          shares: shares.toString(),
        },
      });

      await tx.liquidityEvent.create({
        data: {
          poolId: createdPool.id,
          walletId: wallet.id,
          type: 'ADD',
          shares: shares.toString(),
          credDelta: input.initialCredLiquidity.toString(),
          tokenDelta: input.initialTokenLiquidity.toString(),
        },
      });

      return formatPool(createdPool);
    });
  },

  async buyTokens(input: { poolId: string; walletId: string; credAmount: Decimal }) {
    ensurePositive(input.credAmount, 'credAmount must be positive');
    const pool = await getPoolById(input.poolId);
    const wallet = await getWallet(input.walletId);

    const walletCred = decimal(wallet.credBalance);
    if (walletCred.lt(input.credAmount)) {
      throw new AppError('Insufficient CRED balance for trade');
    }

    const trade = computeBuyTrade(
      input.credAmount,
      decimal(pool.credReserve),
      decimal(pool.tokenReserve),
      pool.feeBasisPoints,
    );

    return prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          credBalance: { decrement: input.credAmount.toString() },
        },
      });

      const holding = await getHolding(wallet.id, pool.ventureTokenId, tx);
      if (holding) {
        await tx.tokenHolding.update({
          where: { walletId_tokenId: { walletId: wallet.id, tokenId: pool.ventureTokenId } },
          data: { amount: { increment: trade.tokensDelta.toString() } },
        });
      } else {
        await tx.tokenHolding.create({
          data: {
            walletId: wallet.id,
            tokenId: pool.ventureTokenId,
            amount: trade.tokensDelta.toString(),
          },
        });
      }

      await tx.liquidityPool.update({
        where: { id: pool.id },
        data: {
          credReserve: decimal(pool.credReserve).add(input.credAmount).toString(),
          tokenReserve: decimal(pool.tokenReserve).sub(trade.tokensDelta).toString(),
        },
      });

      const record = await tx.trade.create({
        data: {
          poolId: pool.id,
          walletId: wallet.id,
          type: 'BUY',
          credDelta: trade.credDelta.toString(),
          tokenDelta: trade.tokensDelta.toString(),
          price: trade.spotPriceAfter.toString(),
          feePaid: trade.feePaid.toString(),
        },
      });

      return {
        trade: {
          id: record.id,
          type: record.type,
          credDelta: trade.credDelta.toString(),
          tokenDelta: trade.tokensDelta.toString(),
          feePaid: trade.feePaid.toString(),
          priceImpact: trade.priceImpact.toString(),
          spotPriceBefore: trade.spotPriceBefore.toString(),
          spotPriceAfter: trade.spotPriceAfter.toString(),
        },
      };
    });
  },

  async sellTokens(input: { poolId: string; walletId: string; tokenAmount: Decimal }) {
    ensurePositive(input.tokenAmount, 'tokenAmount must be positive');
    const pool = await getPoolById(input.poolId);
    const wallet = await getWallet(input.walletId);

    const holding = await getHolding(wallet.id, pool.ventureTokenId);
    if (!holding) {
      throw new AppError('Wallet does not hold this token');
    }

    const holdingAmount = decimal(holding.amount);
    if (holdingAmount.lt(input.tokenAmount)) {
      throw new AppError('Insufficient token balance for trade');
    }

    const trade = computeSellTrade(
      input.tokenAmount,
      decimal(pool.credReserve),
      decimal(pool.tokenReserve),
      pool.feeBasisPoints,
    );

    return prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { credBalance: { increment: trade.credDelta.toString() } },
      });

      await tx.tokenHolding.update({
        where: { walletId_tokenId: { walletId: wallet.id, tokenId: pool.ventureTokenId } },
        data: { amount: { decrement: input.tokenAmount.toString() } },
      });

      await tx.liquidityPool.update({
        where: { id: pool.id },
        data: {
          credReserve: decimal(pool.credReserve).sub(trade.credDelta).toString(),
          tokenReserve: decimal(pool.tokenReserve).add(input.tokenAmount).toString(),
        },
      });

      const record = await tx.trade.create({
        data: {
          poolId: pool.id,
          walletId: wallet.id,
          type: 'SELL',
          credDelta: trade.credDelta.toString(),
          tokenDelta: trade.tokensDelta.toString(),
          price: trade.spotPriceAfter.toString(),
          feePaid: trade.feePaid.toString(),
        },
      });

      return {
        trade: {
          id: record.id,
          type: record.type,
          credDelta: trade.credDelta.toString(),
          tokenDelta: trade.tokensDelta.toString(),
          feePaid: trade.feePaid.toString(),
          priceImpact: trade.priceImpact.toString(),
          spotPriceBefore: trade.spotPriceBefore.toString(),
          spotPriceAfter: trade.spotPriceAfter.toString(),
        },
      };
    });
  },

  async addLiquidity(input: {
    poolId: string;
    walletId: string;
    credAmount: Decimal;
    tokenAmount: Decimal;
  }) {
    ensurePositive(input.credAmount, 'credAmount must be positive');
    ensurePositive(input.tokenAmount, 'tokenAmount must be positive');

    const pool = await getPoolById(input.poolId);
    const wallet = await getWallet(input.walletId);

    const walletCred = decimal(wallet.credBalance);
    if (walletCred.lt(input.credAmount)) {
      throw new AppError('Insufficient CRED balance');
    }

    const holding = await getHolding(wallet.id, pool.ventureTokenId);
    if (!holding) {
      throw new AppError('Wallet does not hold pool token');
    }
    const holdingAmount = decimal(holding.amount);
    if (holdingAmount.lt(input.tokenAmount)) {
      throw new AppError('Insufficient token balance');
    }

    const credReserve = decimal(pool.credReserve);
    const tokenReserve = decimal(pool.tokenReserve);
    const expectedToken = input.credAmount.mul(tokenReserve).div(credReserve);
    const tolerance = expectedToken.mul(0.001);
    if (input.tokenAmount.minus(expectedToken).abs().gt(tolerance)) {
      throw new AppError('Deposit amounts must match existing pool ratio');
    }

    const mintedShares = calculateSharesForDeposit(
      input.credAmount,
      input.tokenAmount,
      decimal(pool.totalShares),
      credReserve,
      tokenReserve,
    );

    return prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { credBalance: { decrement: input.credAmount.toString() } },
      });

      await tx.tokenHolding.update({
        where: { walletId_tokenId: { walletId: wallet.id, tokenId: pool.ventureTokenId } },
        data: { amount: { decrement: input.tokenAmount.toString() } },
      });

      await tx.liquidityPool.update({
        where: { id: pool.id },
        data: {
          credReserve: credReserve.add(input.credAmount).toString(),
          tokenReserve: tokenReserve.add(input.tokenAmount).toString(),
          totalShares: decimal(pool.totalShares).add(mintedShares).toString(),
        },
      });

      const position = await tx.liquidityPosition.upsert({
        where: { poolId_walletId: { poolId: pool.id, walletId: wallet.id } },
        update: { shares: { increment: mintedShares.toString() } },
        create: { poolId: pool.id, walletId: wallet.id, shares: mintedShares.toString() },
      });

      await tx.liquidityEvent.create({
        data: {
          poolId: pool.id,
          walletId: wallet.id,
          type: 'ADD',
          shares: mintedShares.toString(),
          credDelta: input.credAmount.toString(),
          tokenDelta: input.tokenAmount.toString(),
        },
      });

      return {
        positionId: position.id,
        mintedShares: mintedShares.toString(),
      };
    });
  },

  async removeLiquidity(input: { poolId: string; walletId: string; shares: Decimal }) {
    ensurePositive(input.shares, 'shares must be positive');
    const pool = await getPoolById(input.poolId);
    const wallet = await getWallet(input.walletId);

    const position = await prisma.liquidityPosition.findUnique({
      where: { poolId_walletId: { poolId: pool.id, walletId: wallet.id } },
    });

    if (!position) {
      throw new AppError('Wallet has no liquidity in this pool');
    }

    const positionShares = decimal(position.shares);
    if (positionShares.lt(input.shares)) {
      throw new AppError('Not enough LP shares');
    }

    const amounts = calculateWithdrawalForShares(
      input.shares,
      decimal(pool.totalShares),
      decimal(pool.credReserve),
      decimal(pool.tokenReserve),
    );

    return prisma.$transaction(async (tx) => {
      const remainingShares = positionShares.minus(input.shares);

      if (remainingShares.eq(0)) {
        await tx.liquidityPosition.delete({
          where: { poolId_walletId: { poolId: pool.id, walletId: wallet.id } },
        });
      } else {
        await tx.liquidityPosition.update({
          where: { poolId_walletId: { poolId: pool.id, walletId: wallet.id } },
          data: { shares: remainingShares.toString() },
        });
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { credBalance: { increment: amounts.credOut.toString() } },
      });

      const holding = await getHolding(wallet.id, pool.ventureTokenId, tx);
      if (holding) {
        await tx.tokenHolding.update({
          where: { walletId_tokenId: { walletId: wallet.id, tokenId: pool.ventureTokenId } },
          data: { amount: { increment: amounts.tokenOut.toString() } },
        });
      } else {
        await tx.tokenHolding.create({
          data: {
            walletId: wallet.id,
            tokenId: pool.ventureTokenId,
            amount: amounts.tokenOut.toString(),
          },
        });
      }

      await tx.liquidityPool.update({
        where: { id: pool.id },
        data: {
          credReserve: decimal(pool.credReserve).sub(amounts.credOut).toString(),
          tokenReserve: decimal(pool.tokenReserve).sub(amounts.tokenOut).toString(),
          totalShares: decimal(pool.totalShares).sub(input.shares).toString(),
        },
      });

      await tx.liquidityEvent.create({
        data: {
          poolId: pool.id,
          walletId: wallet.id,
          type: 'REMOVE',
          shares: input.shares.toString(),
          credDelta: amounts.credOut.toString(),
          tokenDelta: amounts.tokenOut.toString(),
        },
      });

      return {
        credOut: amounts.credOut.toString(),
        tokenOut: amounts.tokenOut.toString(),
      };
    });
  },

  async listTrades(poolId: string, limit = 50) {
    const trades = await prisma.trade.findMany({
      where: { poolId },
      include: {
        wallet: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return trades.map((trade) => ({
      id: trade.id,
      type: trade.type,
      credDelta: decimal(trade.credDelta).toString(),
      tokenDelta: decimal(trade.tokenDelta).toString(),
      price: decimal(trade.price).toString(),
      feePaid: decimal(trade.feePaid).toString(),
      createdAt: trade.createdAt,
      wallet: {
        id: trade.wallet.id,
        displayName: trade.wallet.displayName,
        handle: trade.wallet.handle,
      },
    }));
  },
};
