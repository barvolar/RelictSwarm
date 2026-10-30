function applyChill(e,amount){
 if(e.hp<=0)return;
 const resistant=e.elite?4:e.champion?2.2:e.id==='brute'?1.55:1;
 if(e.freezeLock>0){e.chill=Math.min(99,(e.chill||0)+amount*.15/resistant);return;}
 e.chill=Math.min(100,(e.chill||0)+amount/resistant);
 e.slow=Math.max(e.slow,.65);
 if(e.chill>=100){
  e.chill=0;
  if(e.elite){e.slow=Math.max(e.slow,1.1);e.freezeLock=2.6;}
  else{e.stun=Math.max(e.stun,.85);e.frost=Math.max(e.frost||0,.85);e.freezeLock=3.2;}
  burst(e.x,e.y,'#a7efff',8,65);
 }
}
function hurtEnemy(e,n,opts={}){if(e.hp<=0||!Number.isFinite(n))return;
 if(e.elite){
  const hit=calculateBossDamage(e,n,S.t,S.threat);
  n=hit.damage;
  e.damageSecondAt=hit.damageSecondAt;e.damageSecond=hit.damageSecond;
  if(bal&&!trainingMode){
   const record=bal.bosses.find(b=>b.id===e.balId);
   if(record){record.blockedByHitCap+=hit.blockedByHitCap;record.blockedByShield+=hit.blockedByShield;record.blockedByDpsCap+=hit.blockedByDpsCap;}
   bal.totals.bossDamageBlocked+=hit.blockedTotal;
  }
 }
 if(trainingMode){trainingRecord.damage+=n;trainingRecord.hits.push({t:S.t,d:n});if(trainingRecord.hits.length>3200)trainingRecord.hits.splice(0,1000)}
 const before=e.hp;balDamage(e,before,n);e.hp-=n;
 if(n>0&&!opts.burn&&!opts.silentHit&&Math.random()<.16)sfx('hit',.7);
 if(e.elite&&before/e.maxHp>.52&&e.hp/e.maxHp<=.52){e.phase=1;e.shield=2.0;burst(e.x,e.y,ENEMY[e.id].col,45,220);banner('⚠ ВТОРАЯ ФАЗА: '+ENEMY[e.id].name,3.5);sfx('bossPhase');shake=14;}
 e.hit=.11;if(opts.slow)e.slow=Math.max(e.slow,opts.slow);if(opts.stun)e.stun=Math.max(e.stun,opts.stun);if(opts.burn){e.burn=Math.max(e.burn,opts.burn);e.burnStrength=Math.max(e.burnStrength||0,opts.burnPower||16*S.playerDmg*(1+S.t/500));e.burnClock??=0;}if(opts.knock){let m=hypot(e.x-S.player.x,e.y-S.player.y);e.x+=(e.x-S.player.x)/m*opts.knock;e.y+=(e.y-S.player.y)/m*opts.knock}if(e.trainingDummy){
  e.displayDamage=(e.displayDamage||0)+n;
  if(S.t-(e.lastDamageDisplay||-1)>=.22){floatNum(e.x+rand(-5,5),e.y-25,e.displayDamage,'#ffebae');e.lastDamageDisplay=S.t;e.displayDamage=0;}
 }else if(n>8&&Math.random()<.38)floatNum(e.x+rand(-8,8),e.y-25,n,opts.crit?AMBER:'#dbffff');if(e.hp<=0)killEnemy(e)}
