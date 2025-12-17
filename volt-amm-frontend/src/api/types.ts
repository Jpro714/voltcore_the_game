export type WalletType = 'PLAYER' | 'CHARACTER' | 'SYSTEM' | 'STORY';

export interface VentureToken {
  id: string;
  symbol: string;
  name: string;
  description?: string | null;
  totalSupply: string;
  circulatingSupply: string;
}

export interface Pool {
  id: string;
  feeBasisPoints: number;
  totalShares: string;
  reserves: {
    cred: string;
    token: string;
  };
  ventureToken: VentureToken;
  spotPrice: string | null;
  updatedAt: string;
}

export interface TokenHoldingSummary {
  tokenId: string;
  symbol: string;
  name: string;
  amount: string;
}

export interface LiquidityPositionSummary {
  poolId: string;
  poolSymbol: string;
  shares: string;
}

export interface WalletSummary {
  id: string;
  displayName: string;
  handle?: string | null;
  twitterUserId?: string | null;
  type: WalletType;
  credBalance: string;
  tokenHoldings: TokenHoldingSummary[];
  liquidityPositions: LiquidityPositionSummary[];
}

export interface TradeReceipt {
  id: string;
  type: 'BUY' | 'SELL';
  credDelta: string;
  tokenDelta: string;
  feePaid: string;
  priceImpact: string;
  spotPriceBefore: string;
  spotPriceAfter: string;
}

export interface TradeHistoryEntry {
  id: string;
  type: 'BUY' | 'SELL';
  credDelta: string;
  tokenDelta: string;
  price: string;
  feePaid: string;
  createdAt: string;
  wallet: {
    id: string;
    displayName: string;
    handle?: string | null;
  };
}

export interface LiquidityReceipt {
  positionId?: string;
  mintedShares?: string;
  credOut?: string;
  tokenOut?: string;
}
