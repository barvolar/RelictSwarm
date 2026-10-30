/**
 * Pure boss/nearby-threat decision. No DOM, canvas, game state or audio access.
 * This file is an actual ES module for Node tests; the standalone HTML builder
 * inlines its exported function inside the legacy game closure.
 */
export function selectCombatTarget(nearest, bosses, x, y, max = 550, weapon = 'pulse', trainingMode = false) {
  if (!nearest || trainingMode || weapon === 'flame') return nearest;
  let boss = null, best = Infinity;
  for (const e of bosses) {
    if (e.hp <= 0) continue;
    const dist = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (dist < best && dist < Math.min(max, 550) ** 2) {
      boss = e;
      best = dist;
    }
  }
  if (!boss) return nearest;
  const dangerRadius = 112;
  if (!nearest.elite && (nearest.x - x) ** 2 + (nearest.y - y) ** 2 < dangerRadius * dangerRadius) return nearest;
  return boss;
}
