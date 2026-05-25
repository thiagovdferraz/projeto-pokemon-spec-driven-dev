import { CardPool } from "./card-pool.js";
import { CollectionStore } from "./collection-store.js";
import { RARITY_FOLDERS, TIER_LABELS } from "./config.js";

export class CollectionView {
  constructor(progressEl, filterEl, gridEl) {
    this._progress = progressEl;
    this._filter   = filterEl;
    this._grid     = gridEl;
    this._active   = null; // active rarity folder filter, null = All
  }

  render() {
    const allCards   = CardPool.allCards();
    const collection = CollectionStore.load();
    this._renderProgress(allCards, collection);
    this._renderFilters();
    this._renderGrid(allCards, collection);
  }

  _renderProgress(allCards, collection) {
    const total   = allCards.length;
    const owned   = allCards.filter(c => collection[c.id]).length;

    const tierLines = RARITY_FOLDERS.map(folder => {
      const tierCards  = allCards.filter(c => c.folder === folder);
      const tierOwned  = tierCards.filter(c => collection[c.id]).length;
      return `${TIER_LABELS[folder]}: ${tierOwned}/${tierCards.length}`;
    }).join(" · ");

    this._progress.innerHTML = `
      <div class="progress-global">Coleção: ${owned}/${total} cartas</div>
      <div class="progress-tiers">${tierLines}</div>
    `;
  }

  _renderFilters() {
    if (this._filter.dataset.built) return; // build once
    this._filter.dataset.built = "1";

    const make = (label, folder) => {
      const btn = document.createElement("button");
      btn.className = "filter-btn" + (folder === this._active ? " active" : "");
      btn.textContent = label;
      btn.dataset.folder = folder ?? "";
      btn.addEventListener("click", () => {
        this._active = folder;
        this._filter.querySelectorAll(".filter-btn").forEach(b =>
          b.classList.toggle("active", b.dataset.folder === (folder ?? "")),
        );
        const allCards   = CardPool.allCards();
        const collection = CollectionStore.load();
        this._renderGrid(allCards, collection);
      });
      return btn;
    };

    this._filter.appendChild(make("Todos", null));
    for (const folder of RARITY_FOLDERS) {
      this._filter.appendChild(make(TIER_LABELS[folder], folder));
    }
  }

  _renderGrid(allCards, collection) {
    const filtered = this._active
      ? allCards.filter(c => c.folder === this._active)
      : allCards;

    this._grid.innerHTML = "";

    for (const card of filtered) {
      const count = collection[card.id] ?? 0;
      const thumb = document.createElement("div");
      thumb.className = "card-thumb" + (count === 0 ? " card-unowned" : "");

      const img = document.createElement("img");
      img.src   = card.imagePath;
      img.alt   = card.name;
      img.title = card.name;
      img.loading = "lazy";
      thumb.appendChild(img);

      if (count >= 2) {
        const badge = document.createElement("span");
        badge.className = "copy-badge";
        badge.textContent = `×${count}`;
        thumb.appendChild(badge);
      }

      this._grid.appendChild(thumb);
    }
  }
}
