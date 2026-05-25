import { PackEngine } from "./pack-engine.js";
import { CollectionStore } from "./collection-store.js";
import { mulberry32 } from "./prng.js";

const SLOT_COUNT = 6;

export class BoosterView {
  constructor(slotsEl, btnEl, onPackSaved) {
    this._slots  = slotsEl;
    this._btn    = btnEl;
    this._onSave = onPackSaved;

    PackEngine.init();
    this._buildSlots();
    this._btn.addEventListener("click", () => this._openPack());
  }

  _buildSlots() {
    this._slots.innerHTML = "";
    this._cardEls = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const container = document.createElement("div");
      container.className = "card-container";

      const inner = document.createElement("div");
      inner.className = "card-inner";

      const back = document.createElement("div");
      back.className = "card-face card-back";

      const front = document.createElement("div");
      front.className = "card-face card-front";

      const img = document.createElement("img");
      img.alt = "";
      front.appendChild(img);
      inner.append(back, front);
      container.appendChild(inner);
      this._slots.appendChild(container);
      this._cardEls.push({ container, img });
    }
  }

  _openPack() {
    this._btn.disabled = true;
    // Reset slots to face-down before starting new pack
    this._cardEls.forEach(({ container }) => container.classList.remove("flipped"));

    const prng  = mulberry32(Date.now());
    const cards = PackEngine.openPack(prng);

    // Load card images into front faces before animation starts
    cards.forEach((card, i) => {
      this._cardEls[i].img.src = card.imagePath;
      this._cardEls[i].img.alt = card.name;
      this._cardEls[i].img.title = card.name;
      this._cardEls[i].container.dataset.rarity = card.folder;
    });

    this._flipSequence(cards, 0);
  }

  _flipSequence(cards, index) {
    if (index >= cards.length) {
      // All flipped — save to collection
      CollectionStore.addPack(cards);
      CollectionStore.incrementPacksOpened();
      this._btn.disabled = false;
      if (this._onSave) this._onSave();
      return;
    }

    const { container } = this._cardEls[index];

    // Small delay between cards so flips feel sequential
    setTimeout(() => {
      container.classList.add("flipped");
      container.addEventListener(
        "transitionend",
        () => this._flipSequence(cards, index + 1),
        { once: true },
      );
    }, index === 0 ? 150 : 0);
  }
}
