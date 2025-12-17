import type { LiquidityReceipt, Pool, TradeHistoryEntry, TradeReceipt, WalletSummary } from './types';

const API_BASE = import.meta.env.VITE_AMM_API_URL ?? 'http://localhost:4200/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(payload.message ?? 'Request failed');
  }
  return response.json();
};

const apiFetch = async <T>(path: string, options?: RequestInit) =>
  handleResponse<T>(
    await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      ...options,
    }),
  );

export const ammApi = {
  getPools: () => apiFetch<Pool[]>('/pools'),
  getPool: (poolId: string) => apiFetch<Pool>(`/pools/${poolId}`),
  getWallets: () => apiFetch<WalletSummary[]>('/wallets'),
  buyTokens: (poolId: string, walletId: string, credAmount: string) =>
    apiFetch<{ trade: TradeReceipt }>(`/pools/${poolId}/buy`, {
      method: 'POST',
      body: JSON.stringify({ walletId, credAmount }),
    }),
  sellTokens: (poolId: string, walletId: string, tokenAmount: string) =>
    apiFetch<{ trade: TradeReceipt }>(`/pools/${poolId}/sell`, {
      method: 'POST',
      body: JSON.stringify({ walletId, tokenAmount }),
    }),
  addLiquidity: (poolId: string, walletId: string, credAmount: string, tokenAmount: string) =>
    apiFetch<LiquidityReceipt>(`/pools/${poolId}/liquidity/add`, {
      method: 'POST',
      body: JSON.stringify({ walletId, credAmount, tokenAmount }),
    }),
  removeLiquidity: (poolId: string, walletId: string, shares: string) =>
    apiFetch<LiquidityReceipt>(`/pools/${poolId}/liquidity/remove`, {
      method: 'POST',
      body: JSON.stringify({ walletId, shares }),
    }),
  getTrades: (poolId: string, limit = 50) =>
    apiFetch<TradeHistoryEntry[]>(`/pools/${poolId}/trades?limit=${limit}`),
};
