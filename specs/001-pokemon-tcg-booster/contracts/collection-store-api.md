# Contract: CollectionStore Module

**File**: `js/collection-store.js`
**Type**: ES Module — internal API consumed by `pack-engine.js` and `collection-view.js`

---

## Responsibility

Encapsulates all `localStorage` read/write operations for the player's card collection and
session metadata. The rest of the application MUST NOT access `localStorage` directly.

---

## localStorage Keys

| Key | Content |
|-----|---------|
| `"ptcg151_collection"` | JSON object: `{ [cardId: string]: count: number }` |
| `"ptcg151_meta"` | JSON object: `{ packsOpened: number }` |

---

## Public API

### `CollectionStore.load(): Collection`

Reads and parses `ptcg151_collection` from `localStorage`.

- Returns `{}` (empty object) if the key is absent or `localStorage` is unavailable.
- Never throws — wraps all storage access in `try/catch`.

### `CollectionStore.save(collection: Collection): void`

Serializes and writes the collection object to `localStorage`.

- Wraps `setItem` in `try/catch`; on `QuotaExceededError`, emits `console.error` and
  does NOT throw (collection state in memory remains valid for the session).

### `CollectionStore.addPack(cards: Card[]): Collection`

Increments the count for each card in `cards`. Reads current state, mutates, saves.

- Returns the updated collection object.
- Called exactly once per pack opening, after the last card reveal animation completes.
- Atomic within a single JS event loop turn (synchronous read → mutate → write).

### `CollectionStore.getCount(cardId: string): number`

Returns the number of copies of `cardId` owned. Returns `0` if not in collection.

### `CollectionStore.getMeta(): Meta`

Returns `{ packsOpened: number }`. Defaults to `{ packsOpened: 0 }` if absent.

### `CollectionStore.incrementPacksOpened(): void`

Increments `packsOpened` in `ptcg151_meta` by 1. Called alongside `addPack`.

### `CollectionStore.isAvailable(): boolean`

Returns `true` if `localStorage` is readable and writable. Used at startup to detect
incognito/private mode and show the session-only warning banner (FR-017).

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `localStorage` unavailable | All reads return defaults; writes emit `console.warn` and no-op |
| JSON parse error on load | Returns `{}` and emits `console.warn` |
| `QuotaExceededError` on save | Emits `console.error`; in-memory state preserved for session |

---

## Testability

The module can be tested by injecting a mock storage object:

```js
// In test environments, replace localStorage with an in-memory map
CollectionStore._storage = new Map(); // internal injection point
```

Alternatively, call `CollectionStore.addPack([card1, card2, ...])` and assert
`CollectionStore.getCount(card1.id) === 1`.
