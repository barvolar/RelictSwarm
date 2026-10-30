function balSnapshot(){
 if(!bal||!S)return;
 const near180=S.enemy.filter(e=>e.hp>0&&!e.elite&&(e.x-S.player.x)**2+(e.y-S.player.y)**2<180**2).length;
 const near300=S.enemy.filter(e=>e.hp>0&&!e.elite&&(e.x-S.player.x)**2+(e.y-S.player.y)**2<300**2).length;
 const live=S.enemy.filter(e=>e.hp>0),liveBoss=live.filter(e=>e.elite);
 bal.totals.peakEnemies=Math.max(bal.totals.peakEnemies,live.length);
 bal.totals.peakNear180=Math.max(bal.totals.peakNear180,near180);
 bal.totals.peakNear300=Math.max(bal.totals.peakNear300,near300);
 bal.timeline.push({t:balR(S.t),level:S.lvl,hp:balR(S.player.hp),maxHp:balR(S.player.maxHp),
  kills:S.kills,enemies:live.length,near180,near300,bullets:S.bullets.length,
  enemyBullets:S.enemyBullets.length,parts:S.parts.length,fx:S.fx.length,
  bossIds:liveBoss.map(e=>e.id),bossHpPct:liveBoss.map(e=>balR(100*e.hp/e.maxHp)),
  damageToBoss5s:balR(bal.damagedBossBucket),damageToOthers5s:balR(bal.damagedThisBucket)});
 bal.damagedThisBucket=0;bal.damagedBossBucket=0;
 if(bal.timeline.length>250)bal.timeline.shift();
}
function balTick(dt){
 if(!bal||trainingMode||!S||S.dead)return;
 bal.nearClock+=dt;bal.clock+=dt;bal.saveClock+=dt;
 if(bal.nearClock>=.5){
  const step=bal.nearClock;bal.nearClock=0;bal.totals.peakEnemies=Math.max(bal.totals.peakEnemies,S.enemy.length);
  const p=S.player;
  const near=S.enemy.reduce((n,e)=>n+(e.hp>0&&!e.elite&&(e.x-p.x)**2+(e.y-p.y)**2<260**2?1:0),0);
  for(const b of bal.bosses){
   if(b.status!=='alive')continue;
   const e=S.bosses.find(e=>e.balId===b.id&&e.hp>0);
   if(!e)continue;
   const d=Math.hypot(e.x-p.x,e.y-p.y);
   if(d<500)b.nearSeconds+=step;
   if(d<360)b.attackRangeSeconds+=step;
   if(near>=8)b.timeSurrounded+=step;
   b.peakNear=Math.max(b.peakNear,near);
  }
 }
 if(bal.clock>=5){bal.clock=0;balSnapshot();}
 if(bal.saveClock>=30){bal.saveClock=0;balStore();}
}
