import { useState } from 'react';
import type { Pool, WalletSummary } from '../api/types';
import SwapForm from './SwapForm';
import LiquidityForm from './LiquidityForm';
import './ActionPanel.css';

interface ActionPanelProps {
  pool: Pool | null;
  wallet: WalletSummary | null;
  onActionComplete: (type: 'success' | 'error', message: string) => void;
}

type ActionTab = 'swap' | 'liquidity';

const ActionPanel = ({ pool, wallet, onActionComplete }: ActionPanelProps) => {
  const [tab, setTab] = useState<ActionTab>('swap');

  return (
    <div className="ActionPanel">
      <div className="ActionPanel-tabs">
        <button type="button" className={tab === 'swap' ? 'active' : ''} onClick={() => setTab('swap')}>
          Swap
        </button>
        <button type="button" className={tab === 'liquidity' ? 'active' : ''} onClick={() => setTab('liquidity')}>
          Liquidity
        </button>
      </div>

      {tab === 'swap' ? (
        <SwapForm pool={pool} wallet={wallet} onActionComplete={onActionComplete} />
      ) : (
        <LiquidityForm pool={pool} wallet={wallet} onActionComplete={onActionComplete} />
      )}
    </div>
  );
};

export default ActionPanel;
