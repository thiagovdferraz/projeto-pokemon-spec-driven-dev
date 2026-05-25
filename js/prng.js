/**
 * Mulberry32 seeded PRNG.
 * Returns a closure () => float in [0, 1).
 * Use a fixed integer seed for deterministic tests; Date.now() for gameplay.
 */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}
