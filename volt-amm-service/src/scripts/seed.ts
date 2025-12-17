import Decimal from 'decimal.js';
import { WalletType } from '@prisma/client';
import { prisma } from '../prisma';
import { ammService } from '../services/ammService';

type PoolSpec = {
  symbol: string;
  name: string;
  description: string;
  creatorHandle: string;
  totalSupply: Decimal;
  initialCredLiquidity: Decimal;
  initialTokenLiquidity: Decimal;
  feeBasisPoints: number;
};

type AllocationSpec = {
  walletHandle: string;
  poolSymbol: string;
  credAmount: Decimal;
};

type WalletBootstrap = {
  type: WalletType;
  initialCredBalance: Decimal;
};

const defaultWalletBootstrap: WalletBootstrap = {
  type: WalletType.PLAYER,
  initialCredBalance: new Decimal(10_000),
};

const walletBootstrapConfig: Record<string, WalletBootstrap> = {
  player: { type: WalletType.PLAYER, initialCredBalance: new Decimal(50_000) },
  voltcore: { type: WalletType.SYSTEM, initialCredBalance: new Decimal(250_000) },
  rumor: { type: WalletType.CHARACTER, initialCredBalance: new Decimal(35_000) },
  chemist: { type: WalletType.CHARACTER, initialCredBalance: new Decimal(25_000) },
  journalist: { type: WalletType.CHARACTER, initialCredBalance: new Decimal(20_000) },
};

const poolSpecs: PoolSpec[] = [
  {
    symbol: 'VCORE',
    name: 'Voltcore Prime',
    description: 'Flagship Voltcore product token used for operational testing.',
    creatorHandle: 'voltcore_energy',
    totalSupply: new Decimal(1_000_000),
    initialCredLiquidity: new Decimal(50_000),
    initialTokenLiquidity: new Decimal(200_000),
    feeBasisPoints: 30,
  },
];

const allocationSpecs: AllocationSpec[] = [
  { walletHandle: 'player_one', poolSymbol: 'VCORE', credAmount: new Decimal(7_500) },
  { walletHandle: 'wiretap_broker', poolSymbol: 'VCORE', credAmount: new Decimal(5_000) },
  { walletHandle: 'synth_chemist', poolSymbol: 'VCORE', credAmount: new Decimal(3_500) },
];

const log = (message: string) => {
  console.log(`[amm:seed] ${message}`);
};

const fetchTwitterUsers = async () => {
  return prisma.$queryRaw<{ id: string; handle: string; displayName: string }[]>`
    SELECT id, handle, "displayName"
    FROM public."User"
  `;
};

const ensureWallets = async () => {
  const walletMap = new Map<string, { id: string; handle?: string; twitterUserId?: string | null }>();
  const twitterUsers = await fetchTwitterUsers();

  for (const user of twitterUsers) {
    const config = walletBootstrapConfig[user.id] ?? defaultWalletBootstrap;
    const wallet = await prisma.wallet.upsert({
      where: { handle: user.handle },
      update: {
        displayName: user.displayName,
        twitterUserId: user.id,
        type: config.type,
      },
      create: {
        displayName: user.displayName,
        handle: user.handle,
        twitterUserId: user.id,
        type: config.type,
        credBalance: config.initialCredBalance.toString(),
      },
    });

    if (wallet.handle) {
      walletMap.set(wallet.handle, { id: wallet.id, handle: wallet.handle, twitterUserId: wallet.twitterUserId });
    }
    if (wallet.twitterUserId) {
      walletMap.set(wallet.twitterUserId, { id: wallet.id, handle: wallet.handle, twitterUserId: wallet.twitterUserId });
    }

    log(`Wallet ready: ${wallet.displayName} (@${wallet.handle ?? user.handle})`);
  }

  return walletMap;
};

const ensurePools = async (walletMap: Map<string, { id: string }>) => {
  for (const spec of poolSpecs) {
    const existingToken = await prisma.ventureToken.findUnique({
      where: { symbol: spec.symbol },
      include: { pool: true },
    });

    if (existingToken?.pool) {
      log(`Pool ${spec.symbol} already exists. Skipping creation.`);
      continue;
    }

    const creator = walletMap.get(spec.creatorHandle);
    if (!creator) {
      throw new Error(`Missing creator wallet ${spec.creatorHandle} for pool ${spec.symbol}`);
    }

    log(`Creating pool ${spec.symbol} with initial liquidity.`);
    await ammService.createPool({
      symbol: spec.symbol,
      name: spec.name,
      description: spec.description,
      creatorWalletId: creator.id,
      totalSupply: spec.totalSupply,
      initialCredLiquidity: spec.initialCredLiquidity,
      initialTokenLiquidity: spec.initialTokenLiquidity,
      feeBasisPoints: spec.feeBasisPoints,
    });
  }
};

const ensureAllocations = async (walletMap: Map<string, { id: string }>) => {
  for (const spec of allocationSpecs) {
    const wallet = walletMap.get(spec.walletHandle);
    if (!wallet) continue;

    const token = await prisma.ventureToken.findUnique({
      where: { symbol: spec.poolSymbol },
      include: { pool: true },
    });

    if (!token?.pool) {
      log(`Pool ${spec.poolSymbol} missing; skipping allocation for ${spec.walletHandle}.`);
      continue;
    }

    const holding = await prisma.tokenHolding.findUnique({
      where: { walletId_tokenId: { walletId: wallet.id, tokenId: token.id } },
    });

    if (holding && new Decimal(holding.amount).gt(0)) {
      log(`${spec.walletHandle} already holds ${spec.poolSymbol}; skipping buy.`);
      continue;
    }

    log(`Executing sample trade: ${spec.walletHandle} buys ${spec.poolSymbol}.`);
    await ammService.buyTokens({
      poolId: token.pool.id,
      walletId: wallet.id,
      credAmount: spec.credAmount,
    });
  }
};

const main = async () => {
  const walletMap = await ensureWallets();
  await ensurePools(walletMap);
  await ensureAllocations(walletMap);
  log('Seed complete.');
};

main()
  .catch((error) => {
    console.error('[amm:seed] Failed to seed data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
