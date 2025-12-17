import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { TradeHistoryEntry } from '../api/types';
import './PriceChart.css';

interface PriceChartProps {
  trades: TradeHistoryEntry[];
}

const PriceChart = ({ trades }: PriceChartProps) => {
  const data = useMemo(() => {
    return [...trades]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((trade) => ({
        time: new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: Number(trade.price),
      }));
  }, [trades]);

  if (!data.length) {
    return <div className="PriceChart-empty">No trades yet. Execute a swap to generate price history.</div>;
  }

  return (
    <div className="PriceChart">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" stroke="#7d8ab3" />
          <YAxis stroke="#7d8ab3" domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ background: '#080a13', border: '1px solid #20253c', color: '#fff' }} />
          <Line type="linear" dataKey="price" stroke="#7df8ff" strokeWidth={2} dot={{ r: 3 }} strokeLinecap="round" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
