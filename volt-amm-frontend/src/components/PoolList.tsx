import type { Pool } from '../api/types';
import { formatNumber } from '../utils/format';
import './PoolList.css';

interface PoolListProps {
  pools: Pool[];
  selectedPoolId: string | null;
  onSelect: (poolId: string) => void;
}

const PoolList = ({ pools, selectedPoolId, onSelect }: PoolListProps) => {
  if (!pools.length) {
    return (
      <div className="PoolList">
        <div className="PoolList-header">
          <h2>Markets</h2>
        </div>
        <p className="PoolList-empty">No pools have been launched yet.</p>
      </div>
    );
  }

  return (
    <div className="PoolList">
      <div className="PoolList-header">
        <h2>Markets</h2>
        <span>{pools.length} live</span>
      </div>
      <ul className="PoolList-items">
        {pools.map((pool) => (
          <li key={pool.id}>
            <button
              type="button"
              className={`PoolList-item${selectedPoolId === pool.id ? ' PoolList-item--active' : ''}`}
              onClick={() => onSelect(pool.id)}
            >
              <div>
                <p className="PoolList-symbol">{pool.ventureToken.symbol}</p>
                <p className="PoolList-name">{pool.ventureToken.name}</p>
              </div>
              <div className="PoolList-stats">
                <span className="PoolList-label">Spot</span>
                <strong>{formatNumber(pool.spotPrice)}</strong>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PoolList;
