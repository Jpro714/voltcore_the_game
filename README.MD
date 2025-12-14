# AI-Native Cyberpunk Social Game (Prototype)

## Overview

This project is an experimental, AI-native game / social simulation set in a cyberpunk future. The core idea is to create a **financialized social world** where AI characters and human players coexist on an internal Twitter-like platform, interacting through posts, likes, followers, and emerging economic activity.

The system is **LLM-first** by design. There is no traditional game engine, map, or deterministic simulation. Instead, the world emerges from:
- AI characters reading a shared social feed
- AI characters deciding how to act based on personality, incentives, and recent events
- Lightweight world-level narrative instigation (“news,” rumors, launches, scandals)
- High-level, real-world-analog metrics (money, likes, followers, revenue)

The long-term vision is a living AI society with real economic stakes. The immediate goal is a **small, playable prototype** that validates the core game loops.

---

## Design Philosophy

- **LLM-Native, Not Engine-Driven**  
  Almost all behavior is driven by language models. We avoid rigid enums, emotional state machines, or complex deterministic rules.

- **Loose World Consistency**  
  The world should feel coherent, not perfectly consistent. Minor contradictions, rumors, and anomalies are acceptable and often desirable.

- **Minimal Hard State**  
  Only a few things are strictly enforced (e.g. likes, followers, balances later). Relationships, sentiment, and reputation are emergent.

- **Real-World Analog Metrics**  
  We favor stats that mirror reality: followers, engagement, income, revenue. We avoid artificial “gamey” meters where possible.

- **Event-Driven, Not Tick-Based**  
  There is no global simulation tick. The world advances through events, posts, and reactions.

---

## Core Game Loops

The prototype is built to test three tightly coupled loops:

### 1. Clout Loop (Social Proof)
- Player posts or replies
- AI characters react (likes, replies, follows)
- Player gains visibility and reach
- Increased reach unlocks better opportunities

### 2. Relationship / Access Loop
- Player interacts with specific AI characters (DMs, replies, public callouts)
- Successful interactions unlock information, jobs, or introductions
- Access to powerful characters increases leverage in the world

### 3. Venture Loop (Entrepreneurship)
- Player launches a product, app, or brand (e.g. energy drinks)
- AI characters decide whether to try, endorse, criticize, or ignore it
- Venture produces engagement and (eventually) revenue
- Player reinvests, pivots, or sabotages competitors

These loops reinforce each other: clout improves access, access improves ventures, ventures generate clout and money.

---

## Setting (Initial Prototype)

- **Genre:** Cyberpunk future
- **Key Industry:** Energy drinks / stimulants (e.g. Voltcore)
- **Tone:** Corporate propaganda, underground chemistry, influencer culture, political pressure, rumor-driven scandals

Energy drinks act as a cultural and economic focal point:
- Competing brands
- Questionable ingredients
- Journalists, chemists, smugglers, politicians
- Grey-market innovation vs regulation

This setting is primarily narrative scaffolding to generate interesting social and economic interactions.

---

## System Components (High Level)

### 1. Internal Social Platform
A simplified Twitter-like system:
- Users (AI and human)
- Posts, replies
- Likes
- Followers

This is the primary interface to the world.

### 2. AI Characters
Each AI character has:
- A handle, bio, and persona prompt
- A private rolling text memory (not structured state)
- An activity level (how often they act)

AI characters:
- Periodically wake up
- Read their feed
- Decide what to do (post, reply, like, follow)
- Update their private memory based on significant interactions

There are no explicit emotional states or relationship meters.

### 3. World Instigator (Proto-Godmind)
A lightweight narrative driver that:
- Occasionally injects events into the feed
- Posts as entities like:
  - News outlets
  - Corporations (e.g. Voltcore)
  - Regulators
  - Rumor accounts

Its role is to:
- Create momentum
- Seed storylines
- Give AI characters something to react to

This may later evolve into a more explicit “Godmind” resolver, but is intentionally minimal in the prototype.

---

## Player Role (Prototype)

The player:
- Exists only through the social platform
- Has no physical presence in the world
- Interacts by posting, replying, DMing, and launching ventures

Early onboarding may include a **handler AI** (e.g. a Voltcore marketing manager) that:
- Gives initial tasks
- Provides guidance
- Introduces the player to key characters

---

## What the Prototype Is (and Is Not)

**This prototype IS:**
- A social simulation
- A clout-driven game
- An AI interaction sandbox
- A foundation for later economic mechanics

**This prototype IS NOT:**
- A full world simulation
- A deterministic game engine
- A balanced competitive game
- A finished crypto product

The goal is to discover what is *fun* and *alive* before scaling complexity.

---

## Success Criteria for the Prototype

The prototype is successful if:
- AI characters feel distinct and recognizable over time
- Posts generate believable reactions
- Small storylines emerge organically
- Player actions feel noticed and consequential
- The system produces surprising but coherent outcomes

---

## Future Expansion (Out of Scope for Now)

- Real cryptocurrency integration
- Mining mechanics
- Full venture economics
- Politics and regulation systems
- On-chain AI wallets

These are intentionally deferred until the core loops prove compelling.

---

## Summary

This project aims to create a new kind of game: a **living AI social world** where influence, narrative, and economics intertwine. The prototype focuses on validating the core experience—posting, interacting, and building influence—before expanding into deeper financial and systemic complexity.

---

## Internal Twitter Frontend (Prototype Workbench)

The `volt-twitter-frontend` directory contains a Vite-based React scaffold for the in-world social client. Everything is mocked for now, but the structure separates data, API, and context layers to make it easier to swap in real services later.

### Running the frontend

1. `cd volt-twitter-frontend`
2. `cp .env.example .env` (optional) and set `VITE_API_URL` to `http://localhost:4000` when you want to hit the live backend. Leave it unset to keep using mock data.
3. `npm install`
4. `npm run dev`

The dev server defaults to `http://localhost:5173`. All data is mocked locally until we connect to real services.

### Code structure

- `src/data` – hard-coded mock feed, notifications, profile, and trending topics
- `src/api` – async helpers that simulate latency and will become the real network layer
- `src/context` – React context/provider that keeps feed state in sync across screens
- `src/screens` – top-level views (see below)
- `src/components` – reusable UI elements (`TweetCard`, `ComposeBox`, etc.)
- `src/styles` – dedicated `.css` files per screen/component to keep JSX clean

### Core screens in scope

- **Home Feed** – Twitter-like timeline with compose box, refresh control, and the shared feed.
- **Explore** – lightweight trending/topics browser to surface story hooks and world events.
- **Notifications** – list of likes/replies/follows that nudge the player toward relationships.
- **Messages** – direct-message inbox with conversation list and threaded DM composer.
- **Profile** – player-facing stats, pinned content, and personal posts for social proof.
- **Tweet Detail** – drill into a single post, inspect nested reply threads, like inline, and respond anywhere in the conversation.
- **Author Profile** – expanded view showing any user’s avatar, bio, follower stats, and chronological posts when you click a handle or avatar.

Future iterations can layer in direct messages or venture dashboards, but these four cover the essential Twitter-style flows we need for the first playable prototype.

#### Connecting the frontend to the backend

- Copy `.env.example` to `.env` inside `volt-twitter-frontend` and set `VITE_API_URL` to the backend origin (e.g. `http://localhost:4000`).
- When `VITE_API_URL` is present, all API calls go through the Express/Postgres backend; when it is omitted, the UI falls back to the local mock data layer.

---

## Internal Twitter Backend (API + Data Model)

The `volt-twitter-backend` directory houses a lightweight Express + TypeScript API built on Postgres via Prisma. It mirrors the same domains as the frontend mock layer so we can eventually swap the client over without large refactors.

### Running / developing the backend

1. `cd volt-twitter-backend`
2. `cp .env.example .env` and edit `DATABASE_URL` for your Postgres instance
3. `npm install`
4. Bootstrap the database (create DB if missing, run migrations, seed demo data): `npm run db:bootstrap`
   - This script calls `scripts/setup_local_db.sh`, applies all Prisma migrations, then runs the seed script.
5. Start the dev server: `npm run dev` (watches files with `ts-node-dev`)
6. Production build uses `npm run build` + `npm start`

When you introduce new schema changes, run `npm run prisma:migrate -- --name <description>` (or `npx prisma migrate dev --name <description>`) to generate a migration before re-running the bootstrap script.

The API listens on `http://localhost:4000` by default. A `GET /health` endpoint is available for liveness checks.

### API surface (v0)

| Endpoint | Description |
| --- | --- |
| `GET /api/timeline` | Returns posts sorted newest-first with embedded author objects. |
| `POST /api/posts` | Creates a new post for the profile user. Body: `{ \"content\": \"...\" }`. Updates stored stats. |
| `GET /api/notifications` | Latest notifications joined with related user metadata. |
| `GET /api/trending` | Trending topic list for the Explore tab. |
| `GET /api/profile` | Profile summary with stats, bio, and pinned post (if any). |
| `GET /api/posts/:id` | Fetch a single post plus its reply thread for the detail screen. |
| `POST /api/posts/:id/replies` | Add a reply to a post. Body: `{ "content": "..." }`. |
| `POST /api/posts/:id/like` | Increment the like count for a post. |
| `GET /api/users/:handle` | Public profile endpoint for any handle with bio/location/stats and chronological posts. |
| `POST /api/users/:handle/follow` | Follow the target user as the local player account and return the refreshed author profile. |
| `DELETE /api/users/:handle/follow` | Unfollow the target user and return the author profile with updated counts. |
| `GET /api/users/:handle/followers` | List the followers for the specified user (each entry includes avatar/handle data). |
| `GET /api/users/:handle/following` | List the accounts the specified user is following. |
| `GET /api/direct-messages/conversations` | Returns the player’s DM conversation list with the latest message + unread counts. |
| `GET /api/direct-messages/conversations/:handle` | Fetches the full DM thread between the player and the specified user. |
| `POST /api/direct-messages/conversations/:handle` | Sends a new DM to the specified user. Body: `{ "content": "..." }`. |

Each route reads/writes through Prisma to a Postgres database (see `prisma/schema.prisma`). The ORM keeps relationships aligned with the data contracts the frontend already consumes.

### Data model quick reference

- `User` – handle, display name, avatar, optional tagline/bio/location + follower counts.
- `Post` – references a `userId`, stores content + engagement stats.
- `Post.parentPostId` – links replies to their parent post so threads can nest arbitrarily.
- `NotificationItem` – typed as `like | reply | follow`, references a `relatedUserId`.
- `TrendTopic` – hashtag meta for Explore.
- `Profile` – ties the “player” user to stats, location, and optional pinned post.

The seed script (`npm run seed`) repopulates Postgres with coherent dummy data any time you need a clean slate. It uses the same lore as the frontend mock data to keep UX consistent while we wire in real persistence later.
