import { FormEvent, useState } from 'react';
import type { Pool, WalletSummary } from '../api/types';
import { ammApi } from '../api/client';
import { formatNumber } from '../utils/format';
import './LiquidityForm.css';

interface LiquidityFormProps {
  pool: Pool | null;
  wallet: WalletSummary | null;
  onActionComplete: (type: 'success' | 'error', message: string) => void;
}

type LiquidityMode = 'add' | 'remove';

const LiquidityForm = ({ pool, wallet, onActionComplete }: LiquidityFormProps) => {
  const [mode, setMode] = useState<LiquidityMode>('add');
  const [credAmount, setCredAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [shares, setShares] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disabled = !pool || !wallet;
  const tokenSymbol = pool?.ventureToken.symbol ?? 'TOKEN';
  const tokenHolding = wallet && pool ? wallet.tokenHoldings.find((holding) => holding.tokenId === pool.ventureToken.id) : null;
  const tokenBalance = tokenHolding ? Number(tokenHolding.amount) : 0;
  const credBalance = wallet ? Number(wallet.credBalance) : 0;
  const lpPosition =
    wallet && pool ? wallet.liquidityPositions.find((position) => position.poolId === pool.id) : null;
  const lpBalance = lpPosition ? Number(lpPosition.shares) : 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!pool || !wallet) return;

    try {
      setIsSubmitting(true);
      if (mode === 'add') {
        if (!credAmount || !tokenAmount) {
          onActionComplete('error', 'Provide both CRED and token amounts.');
          return;
        }
        await ammApi.addLiquidity(pool.id, wallet.id, credAmount, tokenAmount);
        onActionComplete('success', 'Liquidity added successfully.');
        setCredAmount('');
        setTokenAmount('');
      } else {
        if (!shares) {
          onActionComplete('error', 'Enter LP shares to remove.');
          return;
        }
        const receipt = await ammApi.removeLiquidity(pool.id, wallet.id, shares);
        onActionComplete(
          'success',
          `Removed liquidity · +${receipt.credOut ?? '0'} CRED / +${receipt.tokenOut ?? '0'} tokens`,
        );
        setShares('');
      }
    } catch (error) {
      onActionComplete('error', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="LiquidityForm">
      <div className="LiquidityForm-mode">
        <button
          type="button"
          className={mode === 'add' ? 'active' : ''}
          onClick={() => setMode('add')}
          disabled={disabled}
        >
          Add Liquidity
        </button>
        <button
          type="button"
          className={mode === 'remove' ? 'active' : ''}
          onClick={() => setMode('remove')}
          disabled={disabled}
        >
          Remove Liquidity
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'add' ? (
          <>
            <label htmlFor="liquidity-cred">CRED Amount</label>
            <input
              id="liquidity-cred"
              type="number"
              min="0"
              step="0.0001"
              value={credAmount}
              onChange={(event) => setCredAmount(event.target.value)}
              placeholder="0.0"
              disabled={disabled}
            />
            <p className="LiquidityForm-hint">
              {wallet ? `Balance: ${formatNumber(credBalance)} CRED` : 'Select a wallet'}
            </p>
            <label htmlFor="liquidity-token">{tokenSymbol} Amount</label>
            <input
              id="liquidity-token"
              type="number"
              min="0"
              step="0.0001"
              value={tokenAmount}
              onChange={(event) => setTokenAmount(event.target.value)}
              placeholder="0.0"
              disabled={disabled}
            />
            <p className="LiquidityForm-hint">
              {wallet ? `Balance: ${formatNumber(tokenBalance)} ${tokenSymbol}` : 'Select a wallet'}
            </p>
            <p className="LiquidityForm-hint LiquidityForm-hintNote">Deposit must match the pool ratio.</p>
          </>
        ) : (
          <>
            <label htmlFor="liquidity-shares">LP Shares</label>
            <input
              id="liquidity-shares"
              type="number"
              min="0"
              step="0.0001"
              value={shares}
              onChange={(event) => setShares(event.target.value)}
              placeholder="0.0"
              disabled={disabled}
            />
            <p className="LiquidityForm-hint">
              {wallet ? `LP Balance: ${formatNumber(lpBalance)} shares` : 'Select a wallet'}
            </p>
            <p className="LiquidityForm-hint LiquidityForm-hintNote">Returns proportional CRED + tokens.</p>
          </>
        )}

        <button type="submit" disabled={disabled || isSubmitting}>
          {mode === 'add' ? 'Add Liquidity' : 'Remove Liquidity'}
        </button>
      </form>
    </div>
  );
};

export default LiquidityForm;
