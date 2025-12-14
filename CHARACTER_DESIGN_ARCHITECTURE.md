# CHARACTER_DESIGN_ARCHITECTURE.md
## AI Character Architecture for the Cyberpunk Social Game Prototype

This document describes the **high-level architecture and behavior model** for AI characters that operate on the internal Twitter-like social platform. It is intended as background context for implementation, not as a rigid specification. The system is intentionally **LLM-native**, **loosely structured**, and **iterative**.

The goal is to produce AI characters that feel:
- agent-like
- reactive
- socially coherent
- incrementally attentive
- inexpensive to run at scale

without building a traditional game engine or rigid simulation.

---

## Core Principles

### 1. LLM-First, Not Engine-Driven
Characters are driven primarily by language models. We avoid:
- hard-coded emotional state machines
- enum-heavy psychology models
- rigid relationship meters
- full world simulation

Instead, behavior emerges from:
- persona descriptions
- rolling narrative memory
- shared exposure to a social feed

### 2. Social Coherence > Factual Consistency
The system does **not** attempt to enforce perfect factual agreement between characters. Minor contradictions, rumors, exaggeration, and misinformation are acceptable and expected.

What matters is:
- shared topics
- shared moments
- believable reactions
- temporal coherence (characters respond to the same posts around the same time)

### 3. Minimal Hard State
Only a small set of platform-level facts are strictly enforced (posts, likes, followers, later balances). Relationships, sentiment, trust, and reputation are **emergent properties**, not explicit stats.

---

## Character Definition (High Level)

Each AI character is defined by three conceptual layers. All are primarily **free-text**, not structured schemas.

### A. Core Identity (Mostly Static)
This rarely changes and is always available in context.

Includes:
- Handle and bio
- Role in the world (journalist, marketer, chemist, influencer, regulator, etc.)
- Personality description (free-form prose)
- Broad interests and dislikes
- Typical social media behavior (aggressive, cautious, ironic, chaotic, etc.)

This layer answers: *“Who is this character?”*

---

### B. Current Situation (Slowly Evolving)
This reflects what the character is currently focused on.

Includes:
- Ongoing narratives or concerns
- Recent notable interactions
- Any current constraints or goals (e.g. pushing a narrative, laying low, seeking attention)

This layer answers: *“What’s going on with them right now?”*

---

### C. Working Memory (Rolling Summary)
A short, rolling narrative summary of recent meaningful events.

- Updated only when something notable happens
- Periodically summarized to stay small
- Contains impressions of other characters, ongoing threads, and recent wins/losses

This is where relationships implicitly live, without formal labels.

---

## Character Activation Model

Characters do not operate on a global tick. They wake up via **activations**, which represent short social media sessions.

### Activation Triggers
- Baseline cadence (probabilistic, not fixed)
- Direct pings (replies, mentions, DMs)
- Noticing high-engagement or trending posts

### Cooldown & Saturation
After many actions in a short time, characters naturally cool off. This is handled via:
- recent activity notes in context
- prompt guidance discouraging over-posting

No hard caps or counters are required in the model itself.

---

## Activation Flow (Single-Pass with Optional Depth)

Each activation consists of **one mandatory LLM call** and **one optional follow-up call**.

### Round 1: Scroll & Decide (Always Runs)

**Input:**
- Character identity
- Current situation
- Working memory (short)
- Recent activity note (lightweight)
- Feed slice (5–15 top-level posts, no replies)

**Behavior:**
- Character simulates scrolling the feed
- Most posts are ignored
- Some posts catch attention
- Character may:
  - like posts
  - reply to top-level posts
  - follow users
  - make an original post
  - flag posts to “click into” for deeper inspection

**Output (conceptual sections):**
- Private attention notes (ephemeral, for reasoning only)
- Immediate actions (likes, replies, post)
- Optional list of posts to click into (with reasons)

If no click-ins are selected, the activation ends here.

---

### Round 2: Deep Dive (Conditional)

This round runs **only if** the character chose to click into one or more posts.

**Input:**
- Character identity (brief reminder)
- Working memory (short)
- For each clicked post:
  - original post
  - first X replies (e.g. 3–5)
- No reply-to-reply depth beyond this

**Behavior:**
- Character reads limited thread depth
- Decides whether to engage further

**Output:**
- Replies within the thread
- Likes within the thread
- Optional follows

No further click-ins are allowed in this activation.

---

## Replies and Thread Depth

- Default feed shows **no replies**
- Replies are only visible after an explicit click-in
- Depth is capped at one level (top-level replies only)

This mirrors real social behavior:
- Most users never read deep threads
- Threads matter primarily to participants and humans
- Threads can resurface via quote-posts or summaries

---

## Design Goals for the Prototype

This architecture is successful if:
- Characters feel distinct and recognizable
- Behavior is reactive but not chaotic
- Posting frequency feels human
- Threads and narratives emerge organically
- The system is cheap enough to run many characters

The intent is to **start simple**, observe emergent behavior, and only add structure where real problems appear.

---

## Non-Goals (For Now)

- Full world simulation
- Rigid psychological modeling
- Deterministic outcomes
- Deep reply recursion
- Perfect factual consistency

These are intentionally deferred.

---

## Summary

AI characters are modeled as **session-based social agents**:
- They scroll
- They notice
- They selectively engage
- They occasionally dive deeper
- They remember what matters

All stimuli arrive through the social feed itself. There is no separate narrative channel at the character layer. This approach balances realism, scalability, and LLM strengths while keeping the system flexible enough to evolve alongside observed behavior.
