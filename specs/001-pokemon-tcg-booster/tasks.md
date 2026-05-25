---
description: "Task list for Pokémon TCG 151 — Booster Pack Opening Game"
---

# Tasks: Pokémon TCG 151 — Booster Pack Opening Game

**Input**: Design documents from `specs/001-pokemon-tcg-booster/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not explicitly requested — no test tasks generated.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are relative to the repository root

## Path Conventions

Single-project flat structure (per plan.md):
- `js/` — ES module source files
- `css/` — stylesheet files
- `assets/` — card images + `index.json` manifest
- `docs/` — asset documentation

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project skeleton — HTML entry point, base CSS, and asset documentation.
All three tasks touch different files and can start immediately in parallel.

- [ ] T001 Create `index.html` with two `<section>` screens (`#booster-screen` active, `#collection-screen` hidden), sticky `<header>` with nav links, link `css/base.css` + `css/booster.css` + `css/collection.css`, and `<script type="module" src="js/main.js">`
- [ ] T002 [P] Create `css/base.css` with CSS reset (`*, *::before, *::after { box-sizing: border-box }`), `:root` custom properties for colors/spacing/card-dimensions, and base body/header/button typography (no layout rules — those go in booster.css and collection.css)
- [ ] T003 [P] Create `docs/assets.md` documenting the 7-folder rarity structure, `<card-id>.jpg` naming convention, the `index.json` manifest format, and the no-raw-string-paths rule (constitution gate V — see `.specify/memory/constitution.md` Principle V)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core modules consumed by all user story phases. MUST complete before US2 and US3.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [ ] T004 Create `js/config.js` exporting: `SLOT_5_WEIGHTS` object (`{ "02_incomum": 0.90, "03_raras": 0.10 }`), `SLOT_6_WEIGHTS` object (`{ "03_raras": 0.60, "04_duplo_raras": 0.25, "05_arte_secreta": 0.10, "06_duplo_arte_secreta": 0.045, "07_legendaria": 0.005 }`), `RARITY_FOLDERS` array (ordered `01_comum` → `07_legendaria`), and `TIER_LABELS` map of folder → display name (e.g., `"07_legendaria" → "Lendárias"`)
- [ ] T005 [P] Create `js/prng.js` exporting `mulberry32(seed)` — a function that takes a 32-bit integer seed and returns a stateless closure `() => number` producing floats in [0, 1) using the Mulberry32 algorithm (≈ 8 lines); seed with `Date.now()` for gameplay, fixed integer for tests
- [ ] T006 Create `js/card-pool.js` implementing the `CardPool` module per `contracts/card-pool-api.md`: `init(indexUrl?)` fetches and parses `assets/index.json`, `getPool(tier)` returns a copy of a tier's cards, `drawOne(tier, prng, exclude?)` draws one card excluding already-picked IDs, `allCards()` returns all cards sorted by `number` ascending; throw `Error("CardPool: not initialized")` if called before `init`
- [ ] T007 [P] Create `js/collection-store.js` implementing `CollectionStore` per `contracts/collection-store-api.md`: `isAvailable()` probes `localStorage`, `load()` reads `ptcg151_collection` (returns `{}` on error), `save(collection)` writes it (wraps `QuotaExceededError`), `addPack(cards)` increments counts and saves, `getCount(cardId)` returns count or 0, `getMeta()` reads `ptcg151_meta`, `incrementPacksOpened()` increments `packsOpened`; all methods wrapped in `try/catch`
- [ ] T008 Create `js/main.js` as app entry point: call `CardPool.init('./assets/index.json')`, show a session-only warning banner (`#storage-warning`) if `CollectionStore.isAvailable()` returns false, wire `#nav-collection` and `#nav-booster` link clicks to toggle `active`/`hidden` classes on the two screen sections; export `switchScreen(id)` helper for use by view modules

**Checkpoint**: Foundation ready — all modules initialized; navigation works; US1, US2, and US3 can now be built in parallel.

---

## Phase 3: User Story 1 — Download and Prepare the Card Library (Priority: P1) 🎯 MVP Step 1

**Goal**: Developer runs `python download_cards.py` once; all 165 cards land in the correct rarity folders and `assets/index.json` is generated. Game has the data it needs.

**Independent Test**: Run `python download_cards.py`; verify 7 subdirectories exist under `assets/`, each containing `.jpg` files; verify `assets/index.json` is valid JSON with one object per card including `id`, `name`, `number`, `rarity`, `folder`, `imagePath`.

### Implementation for User Story 1

- [ ] T009 [US1] Create `download_cards.py` with a main function that fetches all pages from `https://api.pokemontcg.io/v2/cards` with query param `q=set.id:sv3pt5`, iterating `page` until the returned list is shorter than `pageSize` (handles pagination per FR-001); use `requests` library; print a progress line per card
- [ ] T010 [P] [US1] Add rarity-to-folder mapping dict inside `download_cards.py` covering all 14 API rarity strings to their target folder per the FR-002 table (`"Common" → "01_comum"`, `"Rare Holo" → "03_raras"`, `"Hyper Rare" → "07_legendaria"`, etc.)
- [ ] T011 [US1] Add image download loop in `download_cards.py`: for each card, create the target folder if absent, skip if `assets/<folder>/<id>.jpg` already exists (idempotency, FR-005), otherwise download the image URL from the API response and write as binary `.jpg`
- [ ] T012 [US1] Add unrecognized-rarity guard in `download_cards.py`: if a card's `rarity` field has no mapping in the dict, print a warning to stderr (`[warn] Unknown rarity: <value> — skipped`) and continue without crashing (FR-004)
- [ ] T013 [US1] Add `index.json` generation at the end of `download_cards.py`: collect a list of dicts `{id, name, number, rarity, folder, imagePath}` for every successfully downloaded card, write to `assets/index.json` as a JSON array sorted by `number` ascending (FR-005b)

**Checkpoint**: US1 complete — `python download_cards.py` populates `assets/` and `assets/index.json`. The game can now load card data. US2 and US3 are unblocked.

---

## Phase 4: User Story 2 — Open a Booster Pack (Priority: P1) 🎯 MVP Step 2

**Goal**: Player clicks "Abrir Booster", sees 6 unique cards revealed one by one with CSS 3D flip animation. Collection is saved automatically after the last flip.

**Independent Test**: Serve the project with `python -m http.server 8080`, open the game, click "Abrir Booster" 10 times; confirm: 4 commons in slots 1–4, no duplicate cards per pack, cards flip sequentially, button re-enables after last flip, `localStorage["ptcg151_collection"]` is populated.

### Implementation for User Story 2

- [ ] T014 [US2] Create `js/pack-engine.js` exporting `PackEngine` with `openPack(prng)`: validate that `SLOT_5_WEIGHTS` and `SLOT_6_WEIGHTS` each sum to 1.0 (throw if not); draw slots 1–4 from `CardPool.getPool("01_comum")` sampling without replacement; draw slot 5 using `SLOT_5_WEIGHTS` weighted random tier selection then `CardPool.drawOne()`; draw slot 6 using `SLOT_6_WEIGHTS`; enforce pack-wide uniqueness by passing a `Set` of already-drawn IDs to each `drawOne()` call (FR-006 to FR-012); return array of 6 `Card` objects in slot order
- [ ] T015 [P] [US2] Create `css/booster.css`: card slot grid using CSS Grid (`display: grid; gap: 1rem`) with responsive columns (`2 cols ≤ 480px`, `3 cols ≤ 767px`, `6 cols ≥ 768px`); `.card-container` with `perspective: 800px` and fixed `width`/`aspect-ratio`; `.card-inner` with `transform-style: preserve-3d; transition: transform 600ms ease`; `.card-back` and `.card-front` as `position: absolute; backface-visibility: hidden`; `.card-front` starts `rotateY(180deg)`; `.card-container.flipped .card-inner` set to `rotateY(180deg)` to reveal front; "Abrir Booster" button styles with disabled state
- [ ] T016 [US2] Create `js/booster-view.js`: on "Abrir Booster" button click, disable button and call `PackEngine.openPack(mulberry32(Date.now()))`; set each slot's `.card-front` background image from `card.imagePath`; add `.flipped` class to slot 1; listen for `transitionend` on each `.card-container` to add `.flipped` to the next slot; after slot 6 flips, call `CollectionStore.addPack(cards)` + `CollectionStore.incrementPacksOpened()` and re-enable the button (FR-010, FR-013)
- [ ] T017 [US2] Import and initialize `BoosterView` in `js/main.js` after `CardPool.init()` resolves: create a `BoosterView` instance passing the `#booster-screen` element and attach it; ensure the pack-open cycle resets slot images and removes `.flipped` classes before starting a new pack

**Checkpoint**: US2 complete — full pack opening loop works end-to-end, collection persists.

---

## Phase 5: User Story 3 — View and Filter the Persistent Collection (Priority: P2)

**Goal**: Player opens the collection view, sees all obtained cards in Pokédex order, filters by rarity, reads copy counts, and sees per-tier progress stats.

**Independent Test**: Open 3 packs; navigate to collection; confirm all 18 cards appear with correct ×N badges; apply each rarity filter and confirm only matching cards are shown; "Todos" restores all; reload page and confirm collection is identical; verify progress panel shows correct totals per tier.

### Implementation for User Story 3

- [ ] T018 [P] [US3] Create `css/collection.css`: collection grid with responsive columns (`3 cols ≤ 480px`, `4 cols ≤ 767px`, `6 cols ≤ 1279px`, `8 cols ≥ 1280px`); card thumbnail with `border-radius`, `box-shadow`; `.card-unowned` greyed-out overlay (`opacity: 0.35; filter: grayscale(1)`); copy-count `.badge` (e.g., `×3`) positioned bottom-right of thumbnail; filter tab bar (`display: flex; gap`); progress panel layout (flex row wrapping)
- [ ] T019 [US3] Create `js/collection-view.js` with `render()` method: call `CardPool.allCards()` (sorted by `number`), call `CollectionStore.load()`, for each card build a `<div class="card-thumb">` with `<img src="${card.imagePath}">`, add `.card-unowned` class if count is 0, show `×N` badge if count ≥ 2, append to `#collection-grid`; after grid, render the progress panel showing global count (`X/total`) and per-tier counts using `RARITY_FOLDERS` and `TIER_LABELS` from config.js (FR-014, FR-015b, SC-008)
- [ ] T020 [US3] Add rarity filter logic in `js/collection-view.js`: render filter tabs from `RARITY_FOLDERS` plus a "Todos" tab; on tab click, set `data-active-filter` attribute on the grid container and re-render only cards matching the active tier (or all if "Todos"); preserve Pokédex sort order within the filtered set; update the active-tab visual state (FR-015)
- [ ] T021 [US3] Import and initialize `CollectionView` in `js/main.js`: instantiate with `#collection-screen` element; call `collectionView.render()` each time the collection screen is shown (so it reflects any packs opened since last visit); also call `collectionView.render()` inside `BoosterView`'s post-save callback so the progress panel counters update immediately without requiring the player to navigate away and back (SC-008)

**Checkpoint**: All user stories independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, accessibility, and end-to-end verification.

- [ ] T022 [P] Add `title` attribute (card name) to each card `<img>` element in `js/booster-view.js` and `js/collection-view.js` for hover tooltip and screen-reader accessibility
- [ ] T023 Validate all responsive breakpoints: open the game in browser DevTools device emulation at 320 px, 768 px, and 1280 px; confirm no horizontal scrollbar, no broken layouts, all controls reachable; fix any overflow or layout issues in `css/booster.css` and `css/collection.css` (constitution gate IV, SC-007)
- [ ] T024 Run the `quickstart.md` validation checklist end-to-end: run `python download_cards.py`, serve with `python -m http.server 8080`, open 3 packs, navigate to collection, reload page, confirm all 18+ cards with correct copy counts; confirm `assets/index.json` exists and is valid

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; all 3 tasks parallelizable
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS US2 and US3
  - T005, T007 can run in parallel with T004, T006
- **US1 (Phase 3)**: Independent of Foundational phase — can start after Phase 1
  - T010 can run in parallel with T009
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) completion
  - T015 can run in parallel with T014
- **US3 (Phase 5)**: Depends on Foundational (Phase 2); T018 can start alongside US2
  - T018 (CSS) can run in parallel with US2 implementation tasks
- **Polish (Phase 6)**: Depends on US2 + US3 completion

### User Story Dependencies

- **US1**: Independent (Python script, no JS modules needed)
- **US2**: Requires Foundational phase (CardPool + CollectionStore + config + prng)
- **US3**: Requires Foundational phase; independent of US2 (can be built in parallel)

### Within Each User Story

- US1: T009 → T010 (parallel) → T011 → T012 → T013
- US2: T014 → T015 (parallel) → T016 → T017
- US3: T018 (parallel) → T019 → T020 → T021

### Parallel Opportunities

- T002, T003 run in parallel with T001 (Phase 1)
- T005, T007 run in parallel with T004, T006 (Phase 2)
- T010 runs in parallel with T009 (Phase 3 / US1)
- T015 runs in parallel with T014 (Phase 4 / US2)
- T018 runs in parallel with T014 or T015 (Phase 5 CSS can start during US2)
- T022 runs in parallel with T023 (Phase 6)

---

## Parallel Example: User Story 2 (Booster Opening)

```text
# After Foundational phase completes:

Parallel launch:
  Task T014: Create js/pack-engine.js (openPack logic, weight validation, draw sequence)
  Task T015: Create css/booster.css (grid layout + CSS 3D flip animation)

Then sequentially:
  Task T016: Create js/booster-view.js (button handler, flip sequence, addPack call)
  Task T017: Wire BoosterView in js/main.js
```

---

## Implementation Strategy

### MVP First (US1 + US2 only — fully playable game without collection view)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T008)
3. Complete Phase 3: US1 — download_cards.py (T009–T013)
4. Complete Phase 4: US2 — booster opening (T014–T017)
5. **STOP and VALIDATE**: Open 10 packs, confirm distribution, confirm collection saves to localStorage
6. Demo: fully playable booster opening game

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. US1 → card assets + manifest ready
3. US2 → pack opening loop working → **MVP demo**
4. US3 → collection view + progress panel → **full feature**
5. Polish → responsiveness + accessibility validated → **ready to ship**

### Parallel Team Strategy

With two developers after Foundational is done:
- **Developer A**: US1 (Python script) + US2 (booster opening)
- **Developer B**: US3 CSS (T018 in parallel) then US3 implementation once Foundational is complete

---

## Notes

- `[P]` = different files, no incomplete-task dependencies — safe to parallelize
- `[Story]` label maps each task to a user story for traceability
- No test tasks generated (not requested in spec)
- Each user story phase is independently completable and verifiable
- `assets/` folder must exist before the game can run — US1 (Phase 3) is a hard prerequisite for gameplay validation
- Commit after each phase or logical group; stop at any checkpoint to validate independently
