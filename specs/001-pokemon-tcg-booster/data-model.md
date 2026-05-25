# Data Model: Pokémon TCG 151 — Booster Pack Opening Game

**Branch**: `001-pokemon-tcg-booster` | **Date**: 2026-05-25

---

## Entities

### Card

Represents a single Pokémon TCG card from the 151 set. Sourced from `assets/index.json`
at game startup. Immutable after download.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | string | Unique, non-empty | API card ID (e.g., `"sv3pt5-1"`); used as filename stem |
| `name` | string | Non-empty | Display name (e.g., `"Bulbasaur"`) |
| `number` | integer | 1 – 999 | Set number; primary sort key for collection (Pokédex order) |
| `rarity` | string | One of 7 canonical values | API rarity string — see Rarity Tier table below |
| `folder` | string | One of 7 folder names | Local asset subfolder (e.g., `"01_comum"`) |
| `imagePath` | string | Relative path, `.jpg` | Precomputed relative path (e.g., `"assets/01_comum/sv3pt5-1.jpg"`) |

**Rarity Tier Mapping** (canonical values):

| Tier | `folder` | API `rarity` values |
|------|----------|---------------------|
| Common | `01_comum` | `"Common"` |
| Uncommon | `02_incomum` | `"Uncommon"` |
| Rare | `03_raras` | `"Rare"`, `"Rare Holo"` |
| Double Rare | `04_duplo_raras` | `"Double Rare"`, `"Rare Ultra"`, `"Rare Holo EX"`, `"Rare Holo GX"`, `"Rare Holo V"`, `"Rare Holo VMAX"` |
| Illustration Rare | `05_arte_secreta` | `"Illustration Rare"` |
| Special Illustration Rare | `06_duplo_arte_secreta` | `"Special Illustration Rare"`, `"Rare Rainbow"`, `"Rare Secret"` |
| Hyper Rare | `07_legendaria` | `"Hyper Rare"` |

---

### RarityPool

Derived at runtime from the Card list in `assets/index.json`. Groups cards by rarity tier.
Not persisted — rebuilt every page load.

| Field | Type | Notes |
|-------|------|-------|
| `tier` | string | Folder name (e.g., `"01_comum"`) |
| `cards` | Card[] | All cards belonging to this tier |

**Lifecycle**: Created by `CardPool.init()` after fetching `index.json`. Read-only during gameplay.

---

### Pack

Transient value assembled by `PackEngine.openPack()`. Never persisted.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `cards` | Card[6] | Length exactly 6, all unique | Ordered slot 1 → slot 6 (most common → most rare) |
| `slots` | SlotResult[6] | — | Per-slot metadata (which tier was drawn, which pool used) |

**Slot rules**:

| Slot | Pool Rule |
|------|-----------|
| 1–4 | Always drawn from `01_comum` (Common) |
| 5 | 90% `02_incomum`, 10% `03_raras` |
| 6 | 60% `03_raras`, 25% `04_duplo_raras`, 10% `05_arte_secreta`, 4.5% `06_duplo_arte_secreta`, 0.5% `07_legendaria` |

**Uniqueness**: No card `id` may appear more than once within the same Pack. Sampling is done
without replacement within the pack assembly scope (cards already drawn are excluded from
subsequent draws within the same pack).

---

### CollectionEntry

Represents a player's ownership of a specific card. Persisted in `localStorage`.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `cardId` | string | FK → Card.id | Key in the collection map |
| `count` | integer | ≥ 1 | Number of copies owned; entry absent = 0 copies |

**Persistence schema** (`localStorage` key `"ptcg151_collection"`):

```json
{
  "sv3pt5-1": 2,
  "sv3pt5-207": 1
}
```

---

### CollectionMeta

Aggregated statistics about the player's session. Persisted in `localStorage`.

| Field | Type | Notes |
|-------|------|-------|
| `packsOpened` | integer ≥ 0 | Total packs opened across all sessions |

**Persistence schema** (`localStorage` key `"ptcg151_meta"`):

```json
{
  "packsOpened": 14
}
```

---

### DistributionConfig

Static configuration object defined in `js/config.js`. Single source of truth for all
probability weights. Never read from external files at runtime.

```js
// js/config.js
export const SLOT_5_WEIGHTS = {
  "02_incomum": 0.90,
  "03_raras":   0.10,
};

export const SLOT_6_WEIGHTS = {
  "03_raras":              0.60,
  "04_duplo_raras":        0.25,
  "05_arte_secreta":       0.10,
  "06_duplo_arte_secreta": 0.045,
  "07_legendaria":         0.005,
};
```

**Invariant**: Weights in each table MUST sum to exactly 1.0. Validated at startup by `PackEngine.init()`.

---

## State Transitions

### Pack Opening Flow

```
IDLE
  └─[Player clicks "Open Booster"]→ ASSEMBLING
       └─[PackEngine resolves 6 cards]→ REVEALING
            └─[Card 1 flip completes]→ REVEALING (card 2)
            └─ ... (cards 3–5)
            └─[Card 6 flip completes]→ SAVING
                 └─[CollectionStore.addPack()]→ IDLE
```

- `SAVING` is synchronous and instant (localStorage write).
- Transition `REVEALING → IDLE` is driven by `transitionend` events, not `setTimeout`.
- No user interaction is accepted during `REVEALING` except scrolling (no "skip animation" in v1).

### Collection State

```
localStorage["ptcg151_collection"] = {}   # initial (empty)
  └─[addPack(cards)]→ cardId counts incremented
  └─[Page reload]→ state restored from localStorage
  └─[Browser storage cleared]→ returns to empty initial state
```

---

## Derived / Computed Values

These are computed at runtime from the persisted and loaded data — never stored redundantly:

| Value | Computed from |
|-------|--------------|
| Total cards collected (unique) | `Object.keys(collection).length` |
| Total cards in set | `cardIndex.length` (from `index.json`) |
| Per-tier collected count | `filter(cardIndex, tier).filter(c => collection[c.id])` |
| Per-tier total count | `filter(cardIndex, tier).length` |
| Card `imagePath` | Precomputed in `index.json` by `download_cards.py` |
