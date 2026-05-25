const KEY_COLLECTION = "ptcg151_collection";
const KEY_META       = "ptcg151_meta";

export const CollectionStore = {
  isAvailable() {
    try {
      const t = "__ptcg_test__";
      localStorage.setItem(t, "1");
      localStorage.removeItem(t);
      return true;
    } catch {
      return false;
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(KEY_COLLECTION);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn("CollectionStore: load error —", err.message);
      return {};
    }
  },

  save(collection) {
    try {
      localStorage.setItem(KEY_COLLECTION, JSON.stringify(collection));
    } catch (err) {
      console.error("CollectionStore: save error —", err.message);
    }
  },

  addPack(cards) {
    const col = this.load();
    for (const card of cards) {
      col[card.id] = (col[card.id] ?? 0) + 1;
    }
    this.save(col);
    return col;
  },

  getCount(cardId) {
    return this.load()[cardId] ?? 0;
  },

  getMeta() {
    try {
      const raw = localStorage.getItem(KEY_META);
      return raw ? JSON.parse(raw) : { packsOpened: 0 };
    } catch {
      return { packsOpened: 0 };
    }
  },

  incrementPacksOpened() {
    try {
      const meta = this.getMeta();
      meta.packsOpened = (meta.packsOpened ?? 0) + 1;
      localStorage.setItem(KEY_META, JSON.stringify(meta));
    } catch (err) {
      console.error("CollectionStore: meta save error —", err.message);
    }
  },
};
