import { CardPool } from "./card-pool.js";
import { SLOT_5_WEIGHTS, SLOT_6_WEIGHTS } from "./config.js";

function validateWeights(label, weights) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 1e-9) {
    throw new Error(`PackEngine: ${label} weights sum to ${sum}, expected 1.0`);
  }
}

function weightedDraw(weights, prng) {
  const roll = prng();
  let cumulative = 0;
  for (const [tier, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) return tier;
  }
  return Object.keys(weights).at(-1);
}

export const PackEngine = {
  init() {
    validateWeights("SLOT_5_WEIGHTS", SLOT_5_WEIGHTS);
    validateWeights("SLOT_6_WEIGHTS", SLOT_6_WEIGHTS);
  },

  openPack(prng) {
    const drawn  = new Set();
    const cards  = [];

    // Slots 1–4: always Common (FR-007)
    for (let i = 0; i < 4; i++) {
      const card = CardPool.drawOne("01_comum", prng, drawn);
      if (card) { drawn.add(card.id); cards.push(card); }
    }

    // Slot 5: 90% Uncommon / 10% Rare (FR-008)
    const tier5 = weightedDraw(SLOT_5_WEIGHTS, prng);
    const card5 = CardPool.drawOne(tier5, prng, drawn);
    if (card5) { drawn.add(card5.id); cards.push(card5); }

    // Slot 6: full distribution (FR-009)
    const tier6 = weightedDraw(SLOT_6_WEIGHTS, prng);
    const card6 = CardPool.drawOne(tier6, prng, drawn)
               ?? CardPool.drawOne("03_raras", prng, drawn); // fallback if pool empty
    if (card6) { drawn.add(card6.id); cards.push(card6); }

    return cards; // 6 unique cards, ordered slots 1→6 (FR-006, FR-011)
  },
};
