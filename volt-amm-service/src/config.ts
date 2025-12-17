import dotenv from 'dotenv';

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: parseNumber(process.env.PORT, 4200),
  baseCurrencySymbol: process.env.BASE_CURRENCY_SYMBOL ?? 'CRED',
  defaultTradeFeeBps: parseNumber(process.env.DEFAULT_TRADE_FEE_BPS, 30),
};
