// Boss hit/shield/DPS caps. Takes a snapshot and returns next counters without mutation.
export function calculateBossDamage(enemy, raw, time, threat) {
 const maxHit=enemy.id==='omega'?340:enemy.id==='synth3'?230:enemy.id==='synth2'?190:enemy.id==='synth1'?260:enemy.id==='boss2'?255:285;
 const afterHitCap=Math.min(raw,maxHit);
 const afterShield=enemy.shield>0?afterHitCap*.27:afterHitCap;
 const restart=!enemy.damageSecondAt||time-enemy.damageSecondAt>=1;
 const damageSecondAt=restart?time:enemy.damageSecondAt;
 const spent=restart?0:(enemy.damageSecond||0);
 const ceiling=(enemy.id==='omega'?1400:enemy.id==='synth3'?1050:enemy.id==='synth2'?900:enemy.id==='synth1'?850:enemy.id==='boss2'?950:1030)*(1+Math.max(0,(threat||1)-1)*.17);
 const damage=Math.min(afterShield,Math.max(0,ceiling-spent));
 return {
  damage,damageSecondAt,damageSecond:spent+damage,
  blockedByHitCap:Math.max(0,raw-afterHitCap),
  blockedByShield:Math.max(0,afterHitCap-afterShield),
  blockedByDpsCap:Math.max(0,afterShield-damage),
  blockedTotal:Math.max(0,raw-damage)
 };
}
