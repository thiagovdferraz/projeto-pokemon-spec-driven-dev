# Contract: UI Screens

**Type**: UI layout and interaction contracts
**Implemented by**: `js/booster-view.js`, `js/collection-view.js`, `css/booster.css`, `css/collection.css`

---

## Screen 1 — Booster Opening (Home Screen)

**Route**: Default view on page load (`index.html`)

### Layout

```
┌──────────────────────────────────────────────┐
│  [Pokémon TCG 151]              [Ver Coleção] │  ← header (sticky)
├──────────────────────────────────────────────┤
│                                              │
│         [ Abrir Booster ] ← CTA button      │
│                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │  ?   │ │  ?   │ │  ?   │ │  ?   │        │  ← card slots (6 total)
│  │      │ │      │ │      │ │      │        │
│  └──────┘ └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐                           │
│  │  ?   │ │  ?   │                           │
│  │      │ │      │                           │
│  └──────┘ └──────┘                           │
│                                              │
└──────────────────────────────────────────────┘
```

### Interaction Rules

| Trigger | Behavior |
|---------|----------|
| Page load | 6 card slots shown face-down; "Abrir Booster" button enabled |
| Click "Abrir Booster" | Button disabled; pack assembled; slot 1 flips (CSS 3D, 600 ms) |
| `transitionend` on slot N | Slot N+1 flips; until N=6 |
| `transitionend` on slot 6 | `CollectionStore.addPack()` called; button re-enabled; "Ver Coleção" badge updates |
| Click "Ver Coleção" | Collection screen slides into view (or page navigates, see note) |

### States

- **IDLE**: All 6 slots face-down, button enabled.
- **REVEALING**: Slots flipping one by one, button disabled. No user input accepted on card slots.
- **DONE**: All cards face-up, button re-enabled. Cards remain visible until next "Abrir Booster" click, which resets slots to face-down before starting the new pack.

### Responsive Behavior

| Viewport | Card grid layout |
|----------|-----------------|
| ≤ 480 px (mobile) | 2 columns × 3 rows |
| 481–767 px (tablet) | 3 columns × 2 rows |
| ≥ 768 px (desktop) | 6 columns × 1 row |

---

## Screen 2 — Collection View

**Route**: Toggled via "Ver Coleção" nav link (single-page toggle, no full navigation)

### Layout

```
┌──────────────────────────────────────────────┐
│  [← Abrir Booster]          [Pokémon TCG 151]│  ← header
├──────────────────────────────────────────────┤
│  Progresso: 42/165  │ Comuns: 38/75  │ ...   │  ← progress panel (FR-015b)
├──────────────────────────────────────────────┤
│  [Todos] [Comum] [Incomum] [Rara] [+]        │  ← rarity filter tabs
├──────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ img  │ │ img  │ │ img  │ │ img  │        │  ← card grid
│  │  ×2  │ │  ×1  │ │ ░░░  │ │  ×1  │        │     ░░░ = not yet obtained
│  └──────┘ └──────┘ └──────┘ └──────┘        │
│  ...                                         │
└──────────────────────────────────────────────┘
```

### Interaction Rules

| Trigger | Behavior |
|---------|----------|
| Screen opens | Load collection from `CollectionStore`; load all cards from `CardPool.allCards()` sorted by `number`; render grid |
| Click rarity filter tab | Filter grid to show only cards of that tier; "Todos" clears filter |
| Hover / focus card | Show card name tooltip (accessible) |
| Card not owned | Card shown as greyed-out placeholder (░░░) with no copy count badge |
| Card owned ≥ 2 copies | Show `×N` badge on card image |

### Progress Panel

Displays, per rarity tier and globally:

```
Coleção: 42/165 cartas
Comuns 38/75 · Incomuns 12/30 · Raras 6/20 · Duplo Raras 3/15 · Arte Secreta 1/10 · Duplo Arte 0/9 · Lendárias 0/6
```

- Updates immediately after each `addPack()` call — no page reload needed.
- Numbers derived from `CardPool.allCards()` (total) and `CollectionStore.load()` (owned).

### Responsive Behavior

| Viewport | Card grid columns |
|----------|------------------|
| ≤ 480 px | 3 columns |
| 481–767 px | 4 columns |
| ≥ 768 px | 6 columns |
| ≥ 1280 px | 8 columns |

---

## Navigation Contract

The app is a **single HTML page** (`index.html`). Navigation between the two screens is
achieved by toggling CSS classes (`hidden` / `active`) on two `<section>` elements —
**no page reload, no hash-based routing**.

```html
<section id="booster-screen" class="screen active">...</section>
<section id="collection-screen" class="screen hidden">...</section>
```

Switching screens does not reset the booster state (cards remain face-up until the next pack).
