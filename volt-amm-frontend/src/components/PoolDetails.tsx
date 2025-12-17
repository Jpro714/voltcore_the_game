import type { Pool } from '../api/types';
import { formatNumber } from '../utils/format';
import './PoolDetails.css';

interface PoolDetailsProps {
  pool: Pool | null;
}

const PoolDetails = ({ pool }: PoolDetailsProps) => {
  if (!pool) {
    return (
      <section className="Panel">
        <p>Select a pool to inspect liquidity and price.</p>
      </section>
    );
  }

  return (
    <section className="Panel">
      <header className="Panel-header">
        <div>
          <p className="Panel-label">Selected Pool</p>
          <h2>
            {pool.ventureToken.symbol} · {pool.ventureToken.name}
          </h2>
        </div>
        <span className="Panel-badge">Fee {pool.feeBasisPoints / 100}%</span>
      </header>

      <p className="PoolDetails-description">{pool.ventureToken.description ?? 'No description set.'}</p>

      <div className="PoolDetails-grid">
        <div>
          <span className="PoolDetails-label">CRED Reserve</span>
          <strong>{formatNumber(pool.reserves.cred)}</strong>
        </div>
        <div>
          <span className="PoolDetails-label">{pool.ventureToken.symbol} Reserve</span>
          <strong>{formatNumber(pool.reserves.token)}</strong>
        </div>
        <div>
          <span className="PoolDetails-label">Total LP Shares</span>
          <strong>{formatNumber(pool.totalShares)}</strong>
        </div>
        <div>
          <span className="PoolDetails-label">Spot Price</span>
          <strong>{formatNumber(pool.spotPrice)}</strong>
        </div>
      </div>
    </section>
  );
};

export default PoolDetails;
