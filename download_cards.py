"""
download_cards.py — Download all cards from the Pokémon TCG 151 set (sv3pt5).

Usage:
    python download_cards.py

Requires:
    pip install requests
"""

import io
import json
import os
import sys
import time
import requests

# Ensure stdout supports Unicode (Pokémon names contain ♀/♂ etc.)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ── Rarity → folder mapping (FR-002) ──────────────────────────────────────
RARITY_MAP = {
    "Common":                    "01_comum",
    "Uncommon":                  "02_incomum",
    "Rare":                      "03_raras",
    "Rare Holo":                 "03_raras",
    "Double Rare":               "04_duplo_raras",
    "Rare Ultra":                "04_duplo_raras",
    "Rare Holo EX":              "04_duplo_raras",
    "Rare Holo GX":              "04_duplo_raras",
    "Rare Holo V":               "04_duplo_raras",
    "Rare Holo VMAX":            "04_duplo_raras",
    "Illustration Rare":         "05_arte_secreta",
    "Special Illustration Rare": "06_duplo_arte_secreta",
    "Rare Rainbow":              "06_duplo_arte_secreta",
    "Rare Secret":               "06_duplo_arte_secreta",
    "Hyper Rare":                "07_legendaria",
    # Scarlet & Violet era full-art trainers
    "Ultra Rare":                "04_duplo_raras",
}

API_URL   = "https://api.pokemontcg.io/v2/cards"
SET_QUERY = "set.id:sv3pt5"
PAGE_SIZE = 250
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")


def fetch_all_cards():
    """Fetch all cards for set sv3pt5, handling pagination (FR-001)."""
    cards = []
    page = 1
    while True:
        params = {"q": SET_QUERY, "pageSize": PAGE_SIZE, "page": page}
        resp = requests.get(API_URL, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json().get("data", [])
        cards.extend(data)
        print(f"[fetch] Page {page}: {len(data)} cards retrieved")
        if len(data) < PAGE_SIZE:
            break
        page += 1
        time.sleep(0.3)  # be polite to the API
    return cards


def download_image(url, dest_path):
    """Download a card image to dest_path."""
    resp = requests.get(url, timeout=30, stream=True)
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)


def main():
    print(f"[start] Fetching cards for set sv3pt5 from {API_URL}")
    api_cards = fetch_all_cards()
    print(f"[fetch] Total cards from API: {len(api_cards)}")

    # Create all 7 rarity folders
    folders = set(RARITY_MAP.values())
    for folder in folders:
        os.makedirs(os.path.join(ASSETS_DIR, folder), exist_ok=True)

    index_entries = []
    skipped_rarity = []
    downloaded = 0
    skipped_existing = 0

    for card in api_cards:
        card_id  = card.get("id", "")
        name     = card.get("name", "")
        rarity   = card.get("rarity", "")
        number_s = card.get("number", "0")
        images   = card.get("images", {})
        img_url  = images.get("large") or images.get("small", "")

        # Unrecognized rarity: warn and skip (FR-004)
        if rarity not in RARITY_MAP:
            print(f"[warn] Unknown rarity: '{rarity}' — skipped ({card_id})", file=sys.stderr)
            skipped_rarity.append(card_id)
            continue

        folder    = RARITY_MAP[rarity]
        dest_path = os.path.join(ASSETS_DIR, folder, f"{card_id}.jpg")
        rel_path  = f"assets/{folder}/{card_id}.jpg"

        # Parse card number (may be "001", "SV001", etc.)
        try:
            number = int("".join(filter(str.isdigit, number_s)) or "0")
        except ValueError:
            number = 0

        # Idempotent: skip if already downloaded (FR-005)
        if os.path.exists(dest_path):
            print(f"[skip]  {card_id}  {name:<30} (already exists)")
            skipped_existing += 1
        else:
            print(f"[download] {card_id}  {name:<30} -> {rel_path}")
            try:
                download_image(img_url, dest_path)
                downloaded += 1
                time.sleep(0.05)  # avoid hammering the image CDN
            except Exception as err:
                print(f"[error] Failed to download {card_id}: {err}", file=sys.stderr)
                continue

        index_entries.append({
            "id":        card_id,
            "name":      name,
            "number":    number,
            "rarity":    rarity,
            "folder":    folder,
            "imagePath": rel_path,
        })

    # Sort by set number for consistent Pokédex order
    index_entries.sort(key=lambda c: c["number"])

    # Write assets/index.json (FR-005b)
    index_path = os.path.join(ASSETS_DIR, "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index_entries, f, ensure_ascii=False, indent=2)

    print(f"\n[done] {downloaded} downloaded, {skipped_existing} skipped (existing), "
          f"{len(skipped_rarity)} skipped (unknown rarity).")
    print(f"[done] assets/index.json written with {len(index_entries)} entries.")


if __name__ == "__main__":
    main()
