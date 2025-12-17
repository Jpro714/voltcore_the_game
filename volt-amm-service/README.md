# Volt AMM Service

The Volt AMM Service is an internal Automated Market Maker API that powers venture token markets inside Voltcore The Game. It exposes simple endpoints for launching venture pools, executing buys/sells in CRED, and managing liquidity positions for AI characters or human players.

## Features

- Constant-product pools with configurable fee basis points (defaults to 30 bps).
- Wallet API for provisioning in-game CRED balances.
- Token launch flow that creates a venture token, mints supply to its creator, and seeds the initial pool liquidity.
- Trade endpoints with price impact + fee reporting to feed social/narrative systems.
- LP share tracking + fee accrual via pool reserves.

## Getting Started

1. `cp .env.example .env` and edit `DATABASE_URL` to point at your Postgres instance (schema `amm` is recommended so it can share the existing database).
2. Install dependencies: `npm install`.
3. Generate the Prisma client / run migrations:
   ```sh
   npm run prisma:migrate -- --name init
   ```
   The first run will create the schema. Re-run when the schema changes.
4. (Optional) Seed demo data: `npm run seed`. This provisions a few wallets and a flagship pool with sample liquidity/trades so the frontend has something to render.
5. Start the dev server: `npm run dev` (listens on `http://localhost:4200` by default). A `/health` endpoint is exposed for readiness probes.

> **Note:** This repo currently shares the main Voltcore Postgres database. If you prefer an isolated database, change `DATABASE_URL` accordingly.

## API Surface (v0)

All routes are mounted under `/api`.

### Wallets

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/wallets` | List wallets + CRED balances, venture token holdings, and LP positions. |
| `POST` | `/api/wallets` | Create a wallet. Body: `{ "displayName": string, "handle?": string, "type?": "PLAYER"\|"CHARACTER"\|..., "initialCredBalance?": string | number }`. |
| `POST` | `/api/wallets/:walletId/fund` | Increment a wallet’s CRED balance. Body: `{ "amount": string | number }`. |

### Pools & Tokens

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/pools` | List pools with reserves, spot price, and venture token metadata. |
| `GET` | `/api/pools/:poolId` | Fetch a single pool. |
| `POST` | `/api/pools` | Launch a venture token + pool. Requires `creatorWalletId`, `symbol`, `name`, `initialCredLiquidity`, `initialTokenLiquidity`, and optional `feeBasisPoints`. Total supply defaults to 1,000,000 tokens. |
| `POST` | `/api/pools/:poolId/buy` | Swap CRED for venture tokens. Body: `{ "walletId": string, "credAmount": string | number }`. Returns trade telemetry. |
| `POST` | `/api/pools/:poolId/sell` | Swap venture tokens back to CRED (same body shape as buy but with `tokenAmount`). |
| `POST` | `/api/pools/:poolId/liquidity/add` | Provide liquidity with proportionate CRED + token amounts. |
| `POST` | `/api/pools/:poolId/liquidity/remove` | Withdraw liquidity by burning LP shares. |
| `GET` | `/api/pools/:poolId/trades?limit=50` | Return recent trades (type, price, wallet metadata) for charting/history views. |

All numeric payload fields accept either numeric strings or native numbers. Responses return stringified decimals to avoid precision issues.

## Implementation Notes

- Constant-product math + fee handling lives in `src/lib/ammMath.ts` (Decimal.js ensures deterministic arithmetic).
- Business logic and Prisma access lives in `src/services/ammService.ts` and `src/services/walletService.ts`.
- Validators are powered by Zod for predictable error messages.
- Trade + liquidity events are persisted for future analytics / feed hooks.
- Wallets may optionally store a `twitterUserId`, allowing the seed script to align AMM balances with the existing Volt Twitter + character personas.

## Next Steps / Ideas

- WebSocket or webhook hooks so trades/liquidity actions can broadcast to the social feed in real time.
- Historical metrics endpoints (price candles, volume per pool, etc.).
- Narrative triggers when price impact crosses configured thresholds.
- Admin/ops tooling for seeding demo wallets + venture pools.
