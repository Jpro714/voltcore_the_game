import type { TradeHistoryEntry } from '../api/types';
import { formatNumber } from '../utils/format';
import './TradeHistory.css';

interface TradeHistoryProps {
  trades: TradeHistoryEntry[];
  tokenSymbol?: string;
}

const TradeHistory = ({ trades, tokenSymbol }: TradeHistoryProps) => {
  if (!trades.length) {
    return <div className="TradeHistory-empty">No trades yet.</div>;
  }

  return (
    <div className="TradeHistory">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Trader</th>
            <th>Type</th>
            <th>Price</th>
            <th>CRED Δ</th>
            <th>{tokenSymbol ?? 'Token'} Δ</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td>{trade.wallet.handle ? `@${trade.wallet.handle}` : trade.wallet.displayName}</td>
              <td className={trade.type === 'BUY' ? 'buy' : 'sell'}>{trade.type}</td>
              <td>{formatNumber(trade.price)}</td>
              <td>{formatNumber(trade.credDelta)}</td>
              <td>{formatNumber(trade.tokenDelta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradeHistory;
