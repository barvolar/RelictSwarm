/**
 * Pure fusion eligibility rule: no UI, storage, random numbers or game globals.
 * Tested as an ES module; bundled inline to keep the HTML game self-contained.
 */
export function eligibleFusionIds(state, recipes) {
  if (state.fusionCores < 1 || state.hybrids.length >= 3) return [];
  return Object.entries(recipes)
    .filter(([id, h]) =>
      !state.hybrids.some(z => z.id === id) &&
      [h.a, h.b].every(k => state.drones.some(d => d.id === k)))
    .map(([id]) => id);
}
