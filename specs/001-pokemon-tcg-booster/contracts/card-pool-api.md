# Contract: CardPool Module

**File**: `js/card-pool.js`
**Type**: ES Module — internal API consumed by `pack-engine.js`

---

## Responsibility

Loads `assets/index.json`, builds per-tier rarity pools, and exposes a deterministic
card-draw API. Does not contain any UI logic.

---

## Public API

### `CardPool.init(indexUrl?: string): Promise<void>`

Fetches and parses the card index. Must be called once before any draw operation.

- `indexUrl` defaults to `"./assets/index.json"`.
- Resolves when pools are ready.
- Rejects (throws) if the JSON is malformed or the fetch fails.

### `CardPool.getPool(tier: string): Card[]`

Returns a copy of all cards in the given rarity tier.

- `tier`: one of `"01_comum"`, `"02_incomum"`, `"03_raras"`, `"04_duplo_raras"`,
  `"05_arte_secreta"`, `"06_duplo_arte_secreta"`, `"07_legendaria"`.
- Returns `[]` if tier is empty or unrecognized.
- Does NOT mutate the internal pool.

### `CardPool.drawOne(tier: string, prng: () => number, exclude?: Set<string>): Card | null`

Draws one random card from the given tier.

- `prng`: A seeded PRNG function returning a float in [0, 1). Must be provided by caller.
- `exclude`: Optional set of card IDs to skip (used for within-pack uniqueness).
- Returns `null` if no eligible cards remain in the tier after applying exclusions.
- Does NOT call `prng` if pool is empty.

### `CardPool.allCards(): Card[]`

Returns a flat array of all cards across all tiers, sorted by `number` ascending.

Used by `collection-view.js` to build the full collection grid.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `index.json` not found | `init()` rejects with `Error("CardPool: failed to load index")` |
| Unrecognized rarity in JSON | Card is skipped with `console.warn`; does not throw |
| `drawOne` called before `init` | Throws `Error("CardPool: not initialized")` |
| Empty pool after exclusions | Returns `null`; caller handles fallback |

---

## Testability

Pass a fixed seed to the PRNG and verify `drawOne` returns the same card across runs:

```js
import { mulberry32 } from "./prng.js";
import { CardPool } from "./card-pool.js";

await CardPool.init("./assets/index.json");
const prng = mulberry32(42);
const card = CardPool.drawOne("03_raras", prng);
// card.id must be deterministic for seed=42
```
