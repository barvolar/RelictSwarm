// Pure weapon damage multiplier, shared by standard and fusion weapons.
export function calculateWeaponDamage(playerDamage, rank, powerLevels, rageActive) {
 return playerDamage*(1+Math.sqrt(rank-1)*.14)*(1+powerLevels*.20)*(rageActive?2.1:1);
}
