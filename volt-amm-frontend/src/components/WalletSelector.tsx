import type { WalletSummary } from '../api/types';
import './WalletSelector.css';

interface WalletSelectorProps {
  wallets: WalletSummary[];
  selectedWalletId: string | null;
  onSelect: (walletId: string) => void;
}

const WalletSelector = ({ wallets, selectedWalletId, onSelect }: WalletSelectorProps) => {
  if (!wallets.length) {
    return (
      <div className="WalletSelector">
        <span>No wallets available</span>
      </div>
    );
  }

  return (
    <div className="WalletSelector">
      <label htmlFor="wallet-selector">Wallet</label>
      <select
        id="wallet-selector"
        value={selectedWalletId ?? wallets[0].id}
        onChange={(event) => onSelect(event.target.value)}
      >
        {wallets.map((wallet) => (
          <option key={wallet.id} value={wallet.id}>
            {wallet.displayName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default WalletSelector;
