// Weapon fire pacing; the minimum interval and excess-fire multiplier are deliberate.
export function calculateWeaponCooldown(base, haste, rateLevels, rank) {
 const cooldownBonus=1+Math.log1p(rateLevels)*.40;
 const rawCooldown=base/(haste*cooldownBonus*(1+Math.log1p(rank-1)*.16));
 return {
  cooldown:Math.max(.19,rawCooldown),
  attackOverflow:Math.max(1,.19/Math.max(.0001,rawCooldown))
 };
}
