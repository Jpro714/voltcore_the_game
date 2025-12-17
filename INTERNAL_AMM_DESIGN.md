# INTERNAL_AMM_DESIGN.md
## Internal AMM for the AI-Native Cyberpunk Social Game Prototype

This document describes the **design goals, scope, and conceptual structure** of the internal Automated Market Maker (AMM) used in the prototype. It is intended as **background context for implementation**, not as a final financial specification.

The AMM exists to support **playable economic loops** for both human users and AI characters, not to replicate or compete with production-grade DeFi systems.

---

## Purpose of the Internal AMM

The internal AMM provides a simple, legible way to:
- Launch and trade tokens representing in-game businesses (ventures)
- Allow AI characters to participate in markets using natural “buy/sell” reasoning
- Support speculation, endorsement, and economic signaling within the social world
- Enable future narrative or system-level interventions without on-chain constraints

This AMM is **off-chain and internal** during the prototype phase.

---

## Design Philosophy

### 1. Simplicity Over Financial Sophistication
The AMM should be:
- easy to reason about
- easy to interact with programmatically
- forgiving of small or naive trades

We intentionally avoid:
- order books
- limit orders
- leverage
- shorting
- perps
- advanced risk management

This keeps both AI agents and humans focused on **intent and narrative**, not micro-optimization.

---

### 2. AMM as a Gameplay System
The AMM is part of the game loop, not just infrastructure.

Markets are meant to:
- express belief, hype, or skepticism
- react visibly to social events
- provide feedback to player actions (e.g. “the market didn’t buy it”)

Perfect efficiency or fairness is not a goal.

---

### 3. Minimal but Familiar Mechanics
We intentionally use a **constant-product-style AMM** as the baseline mental model because:
- it is widely understood
- it supports immediate trading without counterparties
- it avoids order-matching complexity

However, the prototype does not attempt to be mathematically pure or audited-grade.

---

## Assets and Markets

### Base Currency
- A single in-game currency (e.g. `CRED`)
- Used for all markets
- Later may be bridged or replaced with real crypto

### Venture Tokens
- Each in-game business or venture has its own fungible token
- Markets are always:
  
  `CRED <-> VENTURE_TOKEN`

- No cross-venture pairs in the prototype

---

## Core AMM Operations (Prototype Scope)

These are the only operations required initially.

### 1. Buy
> Exchange CRED for venture tokens.

- Input: amount of CRED
- Output: amount of venture tokens
- Slippage is visible but understandable

### 2. Sell
> Exchange venture tokens for CRED.

Same mechanics as Buy, reversed.

### 3. Add Liquidity
> Deposit CRED and venture tokens into a pool.

- Returns internal LP shares
- LP shares earn a portion of fees

### 4. Remove Liquidity
> Withdraw CRED and venture tokens from a pool.

Based on share of LP ownership.

No other trading primitives are required for v0.

---

## Fees

- Flat fee per trade (e.g. ~0.3%)
- Fees accrue to liquidity providers

Fee mechanics should be:
- transparent
- easy to explain
- stable

---

## Venture Token Launch Flow

Launching a new business token follows a simple narrative-aligned flow:

1. **Token Creation**
   - New venture token is minted
   - Large or fixed total supply
   - Majority initially held by creator

2. **Initial Liquidity Seeding**
   - Creator deposits:
     - some CRED
     - some venture tokens
   - This establishes the initial price

3. **Market Opens**
   - Other agents and players can trade immediately
   - Price discovery happens via trades

This mirrors real-world startup valuation dynamics in a legible way.

---

## Interaction Model for AI Characters

The AMM must be easy for AI characters to interact with using **high-level intent**, not detailed math.

Characters should reason in terms like:
- “Buy a small amount”
- “Sell some to take profits”
- “Liquidity is thin; big trades move price”
- “I believe in this long-term; add liquidity”

The system should expose:
- approximate current price
- recent price change
- rough liquidity depth (low / medium / high)

Exact reserve math does not need to be visible to agents.

---

## Interaction Model for Humans

Human users interact through:
- simple buy/sell interfaces
- liquidity provision screens
- visible price and slippage feedback

The goal is clarity, not power-user trading.

---

## Relationship to the Social Platform

The AMM is tightly coupled to the social layer:

- Trades may generate feed events (“X bought into Y”)
- Price movement influences perception and narrative
- Social hype or scandal drives trading activity

This feedback loop is a core part of the game.

---

## Non-Goals for the Prototype

The internal AMM explicitly does **not** attempt to provide:

- on-chain settlement
- composability with external protocols
- censorship resistance
- adversarial security guarantees
- high-frequency trading support

These concerns are deferred until the core game proves fun.

---

## Future Directions (Out of Scope for Now)

Once the prototype is validated, possible extensions include:
- bridging internal markets to on-chain AMMs
- migrating select venture tokens to Uniswap or similar
- introducing narrative-driven market events
- more complex fee or liquidity mechanics

None of these are required to build or test the initial experience.

---

## Summary

The internal AMM is a **lightweight economic engine** designed to support:
- emergent speculation
- narrative-driven markets
- simple agent reasoning
- fast iteration

It prioritizes legibility and gameplay over financial rigor and is intentionally scoped to enable rapid experimentation during the prototype phase.
