function balInit(){
 if(!S||trainingMode)return;
 bal={build:'0.10.15-online-test',version:1,created:new Date().toISOString(),
  threat:S.threat,screen:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio||1},
  graphicsQuality:renderQuality,meta:{...save.meta},result:null,
  totals:{spawned:0,spawnBlocked:0,killed:0,eliteKilled:0,champsSpawned:0,
   damageToBoss:0,damageToOthers:0,receivedHits:0,damageReceived:0,bossDamageBlocked:0,
   peakEnemies:0,peakNear180:0,peakNear300:0,levelUps:0},
  bosses:[],choices:[],fusions:[],timeline:[],events:[],
  clock:0,nearClock:0,saveClock:0,bossSeq:0,damagedThisBucket:0,damagedBossBucket:0,prevTime:0};
 bal.events.push({t:0,what:'run_start',level:S.lvl});window.SwarmTelemetry?.start?.();
}
function balSpawn(e){
 if(!bal||trainingMode||!e)return;
 bal.totals.spawned++;
 if(e.champion)bal.totals.champsSpawned++;
 if(e.elite){
  const id='boss-'+(++bal.bossSeq);
  e.balId=id;
  const b={id,kind:e.id,name:ENEMY[e.id]?.name||e.id,
    spawnedAt:balR(S.t),initialHp:balR(e.maxHp),status:'alive',
    killedAt:null,damage:0,rawHits:0,blockedByHitCap:0,blockedByShield:0,blockedByDpsCap:0,nearSeconds:0,attackRangeSeconds:0,
    timeSurrounded:0,peakNear:0,damageTakenWhilePresent:0,healthHalfAt:null};
  bal.bosses.push(b);
  bal.events.push({t:balR(S.t),what:'boss_spawn',name:b.name,id:e.id,hp:b.initialHp});
 }
}
function balDamage(e,pre,n){
 if(!bal||trainingMode||!(n>0)||!(pre>0))return;
 const actual=Math.min(pre,n);
 if(e.elite){
  bal.totals.damageToBoss+=actual;bal.damagedBossBucket+=actual;
  const b=bal.bosses.find(x=>x.id===e.balId);
  if(b){b.damage+=actual;b.rawHits++;if(b.healthHalfAt==null&&pre>e.maxHp*.5&&pre-actual<=e.maxHp*.5)b.healthHalfAt=balR(S.t);}
 }else{bal.totals.damageToOthers+=actual;bal.damagedThisBucket+=actual;}
}
function balKill(e){
 if(!bal||trainingMode)return;
 bal.totals.killed++;
 if(e.elite){
  bal.totals.eliteKilled++;
  const b=bal.bosses.find(x=>x.id===e.balId);
  if(b){b.killedAt=balR(S.t);b.status='killed';}
  bal.events.push({t:balR(S.t),what:'boss_killed',id:e.id,name:ENEMY[e.id]?.name||e.id});
 }
}
function balPlayerHit(damage){
 if(!bal||trainingMode)return;
 bal.totals.receivedHits++;bal.totals.damageReceived+=damage;
 for(const b of bal.bosses)if(b.status==='alive')b.damageTakenWhilePresent+=damage;
}
function balChoose(u){
 if(!bal||trainingMode)return;
 bal.totals.levelUps++;
 bal.choices.push({t:balR(S.t),level:S.lvl,kind:u.kind,id:u.id,
  name:describeUpgrade(u).name,
  rarity:u.rarity?.name||null,mods:Array.isArray(u.keys)?[...u.keys]:[]});
}
function balFusion(id){
 if(!bal||trainingMode)return;
 const h=HYBRIDS[id];bal.fusions.push({t:balR(S.t),id,name:h?.name||id,from:[h.a,h.b]});
}
