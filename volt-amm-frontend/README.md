# Volt AMM Frontend

A lightweight Vite + React console to drive the internal AMM service. It lets operators or designers inspect pools, switch between wallets, and trigger buy/sell/liquidity operations without touching curl.

## Getting Started

1. `cd volt-amm-frontend`
2. `cp .env.example .env` (optional) and set `VITE_AMM_API_URL` if the backend is not on the default `http://localhost:4200/api`.
3. `npm install`
4. `npm run dev` (launches on `http://localhost:4300`)

For production builds use `npm run build` → `npm run preview`.

## Environment Variables

| Key | Description |
| --- | --- |
| `VITE_AMM_API_URL` | Fully qualified base URL for the AMM API (defaults to `http://localhost:4200/api`). |

## Structure

- `src/api` – fetch helpers + shared AMM types.
- `src/components` – presentational panels with paired `.css` files (no inline styles).
- `src/utils/format.ts` – formatting helpers for decimals/percentages.

The UI is intentionally minimal but mirrors the backend actions so we can validate flows end-to-end.
