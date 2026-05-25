# Research: Pokémon TCG 151 — Booster Pack Opening Game

**Branch**: `001-pokemon-tcg-booster` | **Date**: 2026-05-25
**Input**: Technical unknowns from plan.md Technical Context

---

## Decision 1 — Seeded Pseudo-Random Number Generator (PRNG)

**Decision**: Mulberry32 — a 32-bit PRNG seeded with a single 32-bit integer, implemented as
a pure JavaScript function (~10 lines).

**Rationale**:
- Browser's native `Math.random()` is not seedable, making distribution tests non-deterministic.
- Mulberry32 passes statistical quality tests (BigCrush), runs in O(1), needs no dependencies.
- Entire implementation fits in ~8 lines of JS; no external library needed.
- Returns a float in [0, 1) — identical interface to `Math.random()`, trivially swappable.
- Seed can be a timestamp for gameplay (different result each pack) or a fixed value for tests.

**Alternatives considered**:
- Xorshift128+: Also seedable, slightly more complex, similar quality — rejected for minimal code advantage.
- `crypto.getRandomValues()`: Not seedable in a reproducible way — rejected (violates Principle III).
- External PRNG library (e.g., seedrandom): ~3 KB gzipped; adds a dependency with no functional gain over Mulberry32 — rejected.

---

## Decision 2 — CSS 3D Card Flip Animation

**Decision**: Pure CSS `perspective` + `transform-style: preserve-3d` + `rotateY(180deg)`
`transition` on the card container, toggled by adding a CSS class via JavaScript.

**Rationale**:
- No JavaScript animation loop needed — browser handles interpolation at 60 fps on GPU.
- Works in all modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) with no prefix.
- The card element has two faces (`.card-back`, `.card-front`); back starts visible, front hidden
  via `rotateY(180deg)` on the front face; flipping the container reveals the front.
- Animation duration: 600 ms per card — perceptible but not slow; total 6-card sequence ≤ 4 s.
- Triggering the next card flip is done via `transitionend` event on the prior card — no `setTimeout` guessing.

**Alternatives considered**:
- GSAP / Anime.js: Richer animations, but each adds ≥ 50 KB gzipped (violates constitution constraint) — rejected.
- JavaScript `requestAnimationFrame` loop: More control, but more code and no GPU compositing benefit — rejected.
- Lottie JSON animations: Large runtime + file sizes, overkill for a card flip — rejected.

---

## Decision 3 — No-Build Vanilla JS Module Architecture

**Decision**: Plain `<script type="module">` ES module imports in `index.html`, served from a
static HTTP server or `file://`. No bundler (Webpack, Vite, Rollup) required for development or
production.

**Rationale**:
- All target browsers (Chrome 90+, Firefox 88+, Safari 14+) support ES modules natively.
- Zero build step means zero toolchain setup for the end user — consistent with "static host / file://" goal.
- File-by-file module structure (`js/config.js`, `js/prng.js`, etc.) is maintainable without a bundler.
- `file://` + ES modules: works in Chrome and Firefox with no additional flags. Safari requires
  a simple local server (e.g., `python -m http.server`) — documented in quickstart.

**Alternatives considered**:
- Vite dev server + build: Excellent DX, but adds a Node.js toolchain dependency — rejected (constitution Principle I: no server-dependent runtime).
- Single-file `index.html` with all JS inline: Simple but unmaintainable at this complexity — rejected.
- CommonJS `<script>` tags with global variables: Works everywhere including `file://` but pollutes global scope — rejected in favor of ES modules.

---

## Decision 4 — localStorage Schema

**Decision**: Single JSON key `"ptcg151_collection"` storing a plain object mapping
`cardId → count` (integer ≥ 1). Progress metadata (total packs opened) stored in a separate key
`"ptcg151_meta"`.

```json
// localStorage["ptcg151_collection"]
{
  "sv3pt5-1": 2,
  "sv3pt5-45": 1,
  "sv3pt5-207": 3
}

// localStorage["ptcg151_meta"]
{
  "packsOpened": 14
}
```

**Rationale**:
- A single JSON blob is read/written atomically in one `getItem`/`setItem` call — no partial-state corruption.
- The 151 set has ~165 cards; even with max copies the JSON stays well under 10 KB, far below the 5 MB localStorage quota.
- Separate meta key allows clearing pack stats without touching the card collection.
- No schema migration needed for v1 — all fields optional (missing cardId = count 0).

**Alternatives considered**:
- One key per card (`ptcg151_card_<id>`): More atomic per-card writes, but 165+ keys pollutes the localStorage namespace and `Object.keys()` enumeration becomes slow — rejected.
- IndexedDB: Async, transactional, supports larger data — overkill for < 10 KB of data; adds significant boilerplate — rejected.

---

## Decision 5 — assets/index.json Schema

**Decision**: `download_cards.py` generates `assets/index.json` as an array of card objects:

```json
[
  {
    "id": "sv3pt5-1",
    "name": "Bulbasaur",
    "number": 1,
    "rarity": "Common",
    "folder": "01_comum",
    "imagePath": "assets/01_comum/sv3pt5-1.jpg"
  }
]
```

Fields:
- `id`: API card ID (used as filename stem and collection key)
- `name`: Display name
- `number`: Integer set number (1–165+) for Pokédex-order sorting
- `rarity`: Canonical API rarity string (e.g., "Common", "Hyper Rare")
- `folder`: Local subfolder name (e.g., "01_comum") — used to build image path
- `imagePath`: Relative path from project root to the card image

**Rationale**:
- The `number` field is the sort key for collection view (Pokédex order, clarification Q4).
- `imagePath` as a precomputed field avoids path construction logic in the game's JS.
- Flat array (not nested by rarity) lets the game filter by `folder` at runtime with `Array.filter()`.
- Written once by `download_cards.py`; read once at game startup via `fetch('./assets/index.json')`.

**Alternatives considered**:
- Nested by rarity `{"01_comum": [...], "02_incomum": [...]}`: Easier pool lookup, but harder to iterate all cards for collection — rejected for flat array + runtime filter.
- Including base64 image data: Eliminates the need for separate image files, but balloons `index.json` to tens of MB — rejected.
