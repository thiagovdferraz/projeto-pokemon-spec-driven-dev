let _pools = null;   // Map<folder, Card[]>
let _all   = null;   // Card[] sorted by number

function assertInit() {
  if (!_pools) throw new Error("CardPool: not initialized — call init() first");
}

export const CardPool = {
  async init(indexUrl = "./assets/index.json") {
    let data;
    try {
      const res = await fetch(indexUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      throw new Error(`CardPool: failed to load index — ${err.message}`);
    }

    _pools = new Map();
    _all   = [];

    for (const card of data) {
      if (!card.folder) {
        console.warn("CardPool: card missing folder, skipped:", card.id);
        continue;
      }
      if (!_pools.has(card.folder)) _pools.set(card.folder, []);
      _pools.get(card.folder).push(card);
      _all.push(card);
    }

    _all.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  },

  getPool(tier) {
    assertInit();
    return [...(_pools.get(tier) ?? [])];
  },

  drawOne(tier, prng, exclude = new Set()) {
    assertInit();
    const pool = (_pools.get(tier) ?? []).filter(c => !exclude.has(c.id));
    if (pool.length === 0) return null;
    const idx = Math.floor(prng() * pool.length);
    return pool[idx];
  },

  allCards() {
    assertInit();
    return [..._all];
  },
};
