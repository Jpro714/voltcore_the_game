import { WalletType } from '@prisma/client';
import Decimal from 'decimal.js';
import { AppError } from '../errors';
import { prisma } from '../prisma';

const decimal = (value: Decimal.Value) => new Decimal(value);

const sortHoldings = <T>(
  items: T[],
  selector: (item: T) => Decimal,
): T[] => [...items].sort((a, b) => selector(b).cmp(selector(a)));

export const walletService = {
  async list() {
    const wallets = await prisma.wallet.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        tokenHoldings: {
          include: {
            token: true,
          },
        },
        liquidityPositions: {
          include: {
            pool: { include: { ventureToken: true } },
          },
        },
      },
    });

    return wallets.map((wallet) => ({
      id: wallet.id,
      displayName: wallet.displayName,
      handle: wallet.handle,
      twitterUserId: wallet.twitterUserId,
      type: wallet.type,
      credBalance: decimal(wallet.credBalance).toString(),
      tokenHoldings: sortHoldings(wallet.tokenHoldings, (holding) => decimal(holding.amount))
        .filter((holding) => decimal(holding.amount).gt(0))
        .map((holding) => ({
          tokenId: holding.tokenId,
          symbol: holding.token.symbol,
          name: holding.token.name,
          amount: decimal(holding.amount).toString(),
        })),
      liquidityPositions: sortHoldings(wallet.liquidityPositions, (position) => decimal(position.shares))
        .filter((position) => decimal(position.shares).gt(0))
        .map((position) => ({
          poolId: position.poolId,
          poolSymbol: position.pool.ventureToken.symbol,
          shares: decimal(position.shares).toString(),
        })),
    }));
  },

  async create(input: {
    displayName: string;
    handle?: string;
    twitterUserId?: string;
    type?: WalletType;
    initialCredBalance: Decimal;
  }) {
    if (input.initialCredBalance.lt(0)) {
      throw new AppError('initialCredBalance cannot be negative');
    }

    const wallet = await prisma.wallet.create({
      data: {
        displayName: input.displayName,
        handle: input.handle,
        twitterUserId: input.twitterUserId,
        type: input.type ?? WalletType.PLAYER,
        credBalance: input.initialCredBalance.toString(),
      },
    });

    return {
      id: wallet.id,
      displayName: wallet.displayName,
      handle: wallet.handle,
      twitterUserId: wallet.twitterUserId,
      type: wallet.type,
      credBalance: decimal(wallet.credBalance).toString(),
    };
  },

  async fund(walletId: string, amount: Decimal) {
    if (amount.lte(0)) {
      throw new AppError('amount must be positive');
    }

    const wallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { credBalance: { increment: amount.toString() } },
    });

    return {
      id: wallet.id,
      credBalance: decimal(wallet.credBalance).toString(),
    };
  },
};
