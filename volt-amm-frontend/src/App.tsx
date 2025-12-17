import { useCallback, useEffect, useState } from 'react';
import { ammApi } from './api/client';
import type { Pool, WalletSummary, TradeHistoryEntry } from './api/types';
import PoolList from './components/PoolList';
import PoolDetails from './components/PoolDetails';
import WalletSelector from './components/WalletSelector';
import PriceChart from './components/PriceChart';
import ActionPanel from './components/ActionPanel';
import TradeHistory from './components/TradeHistory';
import './App.css';

interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}

const App = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [trades, setTrades] = useState<TradeHistoryEntry[]>([]);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTradesLoading, setIsTradesLoading] = useState(false);

  const refreshState = useCallback(async () => {
    const [poolData, walletData] = await Promise.all([ammApi.getPools(), ammApi.getWallets()]);
    setPools(poolData);
    setWallets(walletData);
    setSelectedPoolId((prev) => {
      if (prev && poolData.some((pool) => pool.id === prev)) {
        return prev;
      }
      return poolData[0]?.id ?? null;
    });
    setSelectedWalletId((prev) => {
      if (prev && walletData.some((wallet) => wallet.id === prev)) {
        return prev;
      }
      return walletData[0]?.id ?? null;
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        await refreshState();
      } catch (error) {
        if (mounted) {
          setStatus({ type: 'error', text: (error as Error).message });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [refreshState]);

  const handleActionComplete = async (type: 'success' | 'error', message: string) => {
    setStatus({ type, text: message });
    if (type === 'success') {
      try {
        await refreshState();
        await loadTrades(selectedPoolId);
      } catch (error) {
        setStatus({ type: 'error', text: (error as Error).message });
      }
    }
  };

  const selectedPool = pools.find((pool) => pool.id === selectedPoolId) ?? null;
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) ?? null;

  const loadTrades = useCallback(
    async (poolId: string | null) => {
      if (!poolId) {
        setTrades([]);
        return;
      }

      setIsTradesLoading(true);
      try {
        const tradeData = await ammApi.getTrades(poolId, 50);
        setTrades(tradeData);
      } catch (error) {
        setStatus({ type: 'error', text: (error as Error).message });
      } finally {
        setIsTradesLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadTrades(selectedPoolId);
  }, [loadTrades, selectedPoolId]);

  if (isLoading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Volt AMM Console</h1>
        </header>
        <div className="App-loading">Loading data…</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <p className="App-eyebrow">Internal Operations</p>
          <h1>Volt AMM Console</h1>
        </div>
        <div className="App-headerActions">
          <WalletSelector wallets={wallets} selectedWalletId={selectedWalletId} onSelect={setSelectedWalletId} />
        </div>
      </header>

      {status && (
        <div className={`App-status App-status--${status.type}`}>
          <span>{status.text}</span>
          <button type="button" onClick={() => setStatus(null)} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      <div className="App-layout">
        <aside className="App-sidebar">
          <PoolList pools={pools} selectedPoolId={selectedPoolId} onSelect={setSelectedPoolId} />
        </aside>

        <main className="App-main">
          <PoolDetails pool={selectedPool} />
          <div className="App-primary">
            <div className="App-chartArea">
              <PriceChart trades={trades} />
            </div>
            <ActionPanel pool={selectedPool} wallet={selectedWallet} onActionComplete={handleActionComplete} />
          </div>
          <div className="App-history">
            <h3>Recent Trades</h3>
            {isTradesLoading && <div className="App-historyLoading">Loading history…</div>}
            {!isTradesLoading && (
              <TradeHistory trades={trades} tokenSymbol={selectedPool?.ventureToken.symbol} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
