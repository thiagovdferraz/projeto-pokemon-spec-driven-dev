# Feature Specification: Pokémon TCG 151 — Booster Pack Opening Game

**Feature Branch**: `001-pokemon-tcg-booster`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "Crie um jogo web de abrir boosters do Pokémon TCG. Script Python para baixar cartas do set 151, jogo com distribuição probabilística, coleção persistente via LocalStorage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Download and Prepare the Card Library (Priority: P1)

A developer (or user setting up the game) runs `download_cards.py` to fetch all cards from
the Pokémon TCG 151 set (set ID `sv3pt5`) and populate the local `./assets/` folder with
card images organized by rarity folder, so the game can run entirely offline from the browser.

**Why this priority**: Without the card images organized on disk, the game has no assets to
display. This is the mandatory setup step before any gameplay is possible.

**Independent Test**: Running `python download_cards.py` produces seven rarity subdirectories
under `./assets/` and every card from the 151 set is saved as a `.jpg` file inside the
correct folder, matching the rarity mapping defined in the requirements.

**Acceptance Scenarios**:

1. **Given** the script is executed with internet access, **When** it calls the
   `https://api.pokemontcg.io/v2/cards` endpoint with filter `set.id:sv3pt5`,
   **Then** it downloads all cards from the set (handling pagination if needed) and
   saves each card image as `<card-id>.jpg` in the appropriate rarity folder.
2. **Given** a card with rarity "Rare Holo", **When** the script maps it to a folder,
   **Then** it saves the image under `assets/03_raras/`.
3. **Given** a card with rarity "Special Illustration Rare", **When** the script maps it,
   **Then** it saves the image under `assets/06_duplo_arte_secreta/`.
4. **Given** a card with an unrecognized rarity string, **When** the script encounters it,
   **Then** it logs a warning and skips that card without crashing.

---

### User Story 2 — Open a Booster Pack (Priority: P1)

A player visits the game in a browser, clicks "Open Booster", and sees 6 cards revealed
one by one with animation — always 4 commons first, then card 5 (uncommon or rare), then
card 6 (the "hit" slot following the full distribution table).

**Why this priority**: This is the core gameplay loop. Everything else supports this moment.

**Independent Test**: Opening 10 packs manually confirms the slot composition (4 commons,
1 uncommon/rare in slot 5, 1 card from the distribution table in slot 6) and that no card
repeats within the same pack.

**Acceptance Scenarios**:

1. **Given** a player clicks "Open Booster", **When** the pack opens, **Then** exactly
   6 cards are revealed sequentially, with a reveal animation for each card, ordered
   from most common (slot 1) to most rare (slot 6).
2. **Given** slot 5 is being drawn, **When** the game runs the distribution,
   **Then** the result is Uncommon 90% of the time and Rare 10% of the time
   (verifiable via seeded simulation over ≥ 1 000 draws).
3. **Given** slot 6 is being drawn, **When** the game runs the distribution,
   **Then** the rarity breakdown matches: Rare 60%, Double Rare 25%, Illustration Rare 10%,
   Special Illustration Rare 4.5%, Hyper Rare 0.5%
   (verifiable via seeded simulation over ≥ 1 000 draws).
4. **Given** a pack is being assembled, **When** 6 cards are selected,
   **Then** no card appears more than once in the same pack.
5. **Given** a rarity pool has fewer available cards than the required draw count,
   **When** the game samples from it, **Then** it samples without crashing and falls back
   gracefully (e.g., draws from a wider pool or shows an informative message).

---

### User Story 3 — View and Filter the Persistent Collection (Priority: P2)

A player opens the collection view to see all cards they have accumulated across multiple
booster openings, filter them by rarity, and check how many copies of each card they own.

**Why this priority**: Persistent collection gives long-term replay value and is the
primary reason to keep opening packs. Without it, each session starts blank.

**Independent Test**: Open 3 packs, reload the page, open the collection view, confirm all
18 cards appear with correct copy counts; apply a rarity filter and confirm only cards of
that rarity are shown.

**Acceptance Scenarios**:

1. **Given** a player has opened packs, **When** they navigate to the collection view,
   **Then** every card obtained across all sessions (including after page reload) is displayed
   with its image, name, rarity label, and copy count.
2. **Given** the collection view is open, **When** the player selects a rarity filter,
   **Then** only cards of that rarity are shown; selecting "All" clears the filter.
3. **Given** a card appears 3 times in a player's collection, **When** it is displayed,
   **Then** a copy-count indicator (e.g., "×3") is clearly visible on or near the card.
4. **Given** the player clears browser storage, **When** they reload the page,
   **Then** the collection resets to empty and the UI reflects this gracefully without errors.

---

### Edge Cases

- What happens when a rarity folder contains 0 eligible cards for a required slot?
- How does the game behave when `localStorage` is full or unavailable (incognito mode)?
- What if the same card must fill multiple slots (only possible if pool is exhausted)?
- What if `download_cards.py` is run again after assets already exist — does it skip or overwrite?

## Requirements *(mandatory)*

### Functional Requirements

**Setup Script**

- **FR-001**: `download_cards.py` MUST query `https://api.pokemontcg.io/v2/cards` with
  filter `set.id:sv3pt5` and handle all paginated responses until all cards are retrieved.
- **FR-002**: The script MUST map each card's `rarity` field to one of the seven asset
  folders using the following table:

  | API Rarity String | Target Folder |
  |---|---|
  | Common | `assets/01_comum/` |
  | Uncommon | `assets/02_incomum/` |
  | Rare, Rare Holo | `assets/03_raras/` |
  | Double Rare, Rare Ultra, Rare Holo EX, Rare Holo GX, Rare Holo V, Rare Holo VMAX | `assets/04_duplo_raras/` |
  | Illustration Rare | `assets/05_arte_secreta/` |
  | Special Illustration Rare, Rare Rainbow, Rare Secret | `assets/06_duplo_arte_secreta/` |
  | Hyper Rare | `assets/07_legendaria/` |

- **FR-003**: Each card image MUST be saved as `<card-id>.jpg` inside the corresponding
  rarity folder. The `card-id` is the unique identifier returned by the API.
- **FR-004**: The script MUST log a warning and skip (not crash) cards with unrecognized
  rarity strings.
- **FR-005**: The script MUST be idempotent — running it a second time MUST skip cards
  whose `.jpg` file already exists on disk.

**Booster Pack Opening**

- **FR-006**: Each booster pack MUST contain exactly 6 unique cards (no duplicates within
  a single pack).
- **FR-007**: Slots 1–4 MUST always be drawn from the Common pool (`01_comum`).
- **FR-008**: Slot 5 MUST be drawn using the distribution: Uncommon 90%, Rare 10%
  (Rare = any card from `03_raras`).
- **FR-009**: Slot 6 MUST be drawn using the distribution: Rare 60%, Double Rare 25%,
  Illustration Rare 10%, Special Illustration Rare/Rainbow/Secret 4.5%, Hyper Rare 0.5%.
- **FR-010**: Cards MUST be revealed sequentially (slot 1 → slot 6), each with a reveal
  animation before the next card becomes visible.
- **FR-011**: Cards within a pack MUST be displayed in rarity order (most common first,
  most rare last).
- **FR-012**: The probabilistic sampling engine MUST expose a seeded interface so that
  results are fully deterministic in tests given the same seed.

**Collection & Persistence**

- **FR-013**: Every card obtained from opening a booster MUST be added to the player's
  persistent collection stored in `localStorage`.
- **FR-014**: The collection view MUST display each distinct card obtained, showing the
  card image, card name, rarity, and number of copies owned.
- **FR-015**: The collection view MUST support filtering cards by rarity (one rarity at a
  time, plus an "All" option).
- **FR-016**: Copy counts MUST persist across page reloads and browser sessions within
  the same browser profile.
- **FR-017**: When `localStorage` is unavailable, the game MUST display an informative
  message and allow play without persistence (session-only mode), without throwing
  unhandled errors.

**General**

- **FR-018**: The application MUST be entirely client-side — no server process is required
  to run it; it MUST work when served from any static host or opened via `file://`.
- **FR-019**: The UI MUST be fully functional and visually coherent at 320 px, 768 px,
  and 1280 px viewport widths.

### Key Entities

- **Card**: Represents a single Pokémon TCG card. Key attributes: unique ID, name, rarity
  label, local image path, rarity folder (one of the 7 defined).
- **Pack**: A transient collection of exactly 6 unique cards assembled for one opening event.
  Resolved at open time; not persisted.
- **Collection Entry**: A player's ownership record for a given card. Attributes: card ID,
  copy count. Persisted in `localStorage`.
- **Rarity Pool**: The set of all available cards in a given rarity tier, loaded from the
  `./assets/` folder structure at runtime.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running `download_cards.py` completes without errors and produces all 7 rarity
  folders populated with card images for every card in the 151 set.
- **SC-002**: A player can open a booster pack and see all 6 cards revealed within 5 seconds
  on a modern desktop or mobile browser.
- **SC-003**: In a simulation of 10 000 pack openings with a fixed seed, the slot-6 rarity
  distribution falls within ±2% of the declared weights for every rarity tier.
- **SC-004**: In a simulation of 10 000 pack openings with a fixed seed, the slot-5 rarity
  distribution falls within ±2% of the declared weights (Uncommon 90% / Rare 10%).
- **SC-005**: A player's full collection is correctly restored after a page reload — zero
  cards lost, copy counts exact.
- **SC-006**: The collection filter shows only cards of the selected rarity; switching to
  "All" restores the full view — verified for every rarity tier.
- **SC-007**: The game loads and all interactions work at 320 px viewport width without
  horizontal scrolling or broken layouts.

## Assumptions

- The `pokemontcg.io` API is publicly accessible without authentication for the card list
  endpoint (free tier); the script does not handle authentication headers.
- Card images are served by the API as direct URLs accessible for download.
- The player's browser supports `localStorage` and modern CSS layout (Grid/Flexbox);
  older browsers (IE 11) are out of scope.
- The `./assets/` folder is co-located with the game's HTML/JS files and served from the
  same origin or filesystem path so relative paths resolve correctly.
- Re-running `download_cards.py` after a partial download completes the missing files
  without re-downloading cards already on disk (idempotent behavior).
- Out of scope: card trading between players, battle/combat mechanics, user login or
  accounts, purchasing booster packs with virtual currency, card deck building.
