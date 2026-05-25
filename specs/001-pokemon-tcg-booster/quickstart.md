# Quickstart: Pokémon TCG 151 — Booster Pack Opening Game

**Branch**: `001-pokemon-tcg-booster`

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.9+ | Run `download_cards.py` |
| `requests` library | any recent | HTTP calls in download script |
| Modern browser | Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+ | Play the game |

---

## Step 1 — Install Python dependency

```bash
pip install requests
```

---

## Step 2 — Download cards from the Pokémon TCG API

```bash
python download_cards.py
```

This script:
1. Queries `https://api.pokemontcg.io/v2/cards?q=set.id:sv3pt5` (handles pagination)
2. Creates `assets/01_comum/` through `assets/07_legendaria/` folders
3. Downloads each card image as `<card-id>.jpg` into the correct rarity folder
4. Generates `assets/index.json` with id, name, number, rarity, folder, and imagePath per card

**Expected output**:
```
[download] sv3pt5-1  Bulbasaur           → assets/01_comum/sv3pt5-1.jpg
[download] sv3pt5-2  Ivysaur             → assets/01_comum/sv3pt5-2.jpg
...
[done] 165 cards downloaded. assets/index.json written.
```

**Re-running**: Safe to re-run — already-downloaded images are skipped.

---

## Step 3 — Serve the game

### Option A: Python HTTP server (recommended, works everywhere)

```bash
python -m http.server 8080
```

Then open: `http://localhost:8080`

### Option B: Open directly (Chrome / Firefox only)

Double-click `index.html` — works in Chrome and Firefox.
Safari requires Option A (ES modules are blocked on `file://` in Safari).

### Option C: VS Code Live Server

Install the "Live Server" extension, right-click `index.html` → "Open with Live Server".

---

## Validation Checklist

After setup, verify:

- [ ] `assets/index.json` exists and contains entries for all 165 cards
- [ ] At least one folder in `assets/` contains `.jpg` files
- [ ] Game loads without console errors
- [ ] Clicking "Abrir Booster" reveals 6 cards with flip animation
- [ ] Opening 3 packs and reloading the page preserves the collection

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `ModuleNotFoundError: requests` | Run `pip install requests` |
| API rate limit / timeout | Re-run `download_cards.py` — it skips already-downloaded files |
| "Failed to load index.json" error | Ensure you are serving via HTTP (Step 3), not opening directly in Safari |
| Cards not showing images | Verify `.jpg` files exist in `assets/` subfolders |
| Collection not persisting | Check if browser is in incognito/private mode (localStorage disabled) |
