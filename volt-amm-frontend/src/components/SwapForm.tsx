import { FormEvent, useMemo, useState } from 'react';
import type { Pool, WalletSummary } from '../api/types';
import { ammApi } from '../api/client';
import { estimateBuyOutput, estimateSellOutput } from '../utils/ammMath';
import { formatNumber } from '../utils/format';
import './SwapForm.css';

interface SwapFormProps {
  pool: Pool | null;
  wallet: WalletSummary | null;
  onActionComplete: (type: 'success' | 'error', message: string) => void;
}

type SwapMode = 'buy' | 'sell';

const SwapForm = ({ pool, wallet, onActionComplete }: SwapFormProps) => {
  const [mode, setMode] = useState<SwapMode>('buy');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disabled = !pool || !wallet;
  const tokenSymbol = pool?.ventureToken.symbol ?? 'TOKEN';
  const credReserve = pool ? Number(pool.reserves.cred) : 0;
  const tokenReserve = pool ? Number(pool.reserves.token) : 0;
  const feeBps = pool?.feeBasisPoints ?? 30;

  const tokenHolding = wallet && pool ? wallet.tokenHoldings.find((holding) => holding.tokenId === pool.ventureToken.id) : null;
  const tokenBalance = tokenHolding ? Number(tokenHolding.amount) : 0;
  const credBalance = wallet ? Number(wallet.credBalance) : 0;

  const expectedOutput = useMemo(() => {
    if (!pool || !amount) return 0;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0;
    return mode === 'buy'
      ? estimateBuyOutput(numericAmount, credReserve, tokenReserve, feeBps)
      : estimateSellOutput(numericAmount, credReserve, tokenReserve, feeBps);
  }, [amount, credReserve, feeBps, mode, pool, tokenReserve]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'buy' ? 'sell' : 'buy'));
    setAmount('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!pool || !wallet) return;
    if (!amount) {
      onActionComplete('error', 'Enter an amount to swap.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'buy') {
        const result = await ammApi.buyTokens(pool.id, wallet.id, amount);
        onActionComplete(
          'success',
          `Swapped ${amount} CRED for ${result.trade.tokenDelta} ${pool.ventureToken.symbol}`,
        );
      } else {
        const result = await ammApi.sellTokens(pool.id, wallet.id, amount);
        onActionComplete('success', `Swapped ${amount} ${tokenSymbol} for ${result.trade.credDelta} CRED`);
      }
      setAmount('');
    } catch (error) {
      onActionComplete('error', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const balanceText =
    mode === 'buy'
      ? `Balance: ${formatNumber(credBalance)} CRED`
      : `Balance: ${formatNumber(tokenBalance)} ${tokenSymbol}`;

  return (
    <div className="SwapForm">
      <form onSubmit={handleSubmit}>
        <div className="SwapForm-direction">
          <label htmlFor="swap-amount">{mode === 'buy' ? 'Spend CRED' : `Spend ${tokenSymbol}`}</label>
          <button type="button" onClick={toggleMode} disabled={disabled}>
            Swap Direction
          </button>
        </div>
        <input
          id="swap-amount"
          type="number"
          min="0"
          step="0.0001"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.0"
          disabled={disabled}
        />
        <p className="SwapForm-hint">{wallet ? balanceText : 'Select a wallet to trade.'}</p>
        <div className="SwapForm-result">
          <p>Receive</p>
          <strong>≈ {formatNumber(expectedOutput)}</strong>
          <span>{mode === 'buy' ? tokenSymbol : 'CRED'}</span>
        </div>
        <button type="submit" disabled={disabled || isSubmitting}>
          Swap
        </button>
      </form>
    </div>
  );
};

export default SwapForm;
