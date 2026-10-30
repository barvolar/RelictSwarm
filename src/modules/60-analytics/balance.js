const BAL_STORE='relictSwarm_last_balance_report_v1';
let bal=null,balLast=null;
try{balLast=JSON.parse(localStorage.getItem(BAL_STORE)||'null')}catch{}
const balR=v=>Math.round((Number(v)||0)*10)/10;
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
function balReport(){
 if(!bal||!S)return balLast;
 const now=balR(S.t),bosses=bal.bosses.map(b=>{
  const e=S.enemy.find(e=>e.balId===b.id&&e.hp>0);
  return {...b,damage:balR(b.damage),blockedByHitCap:balR(b.blockedByHitCap),blockedByShield:balR(b.blockedByShield),blockedByDpsCap:balR(b.blockedByDpsCap),nearSeconds:balR(b.nearSeconds),
   attackRangeSeconds:balR(b.attackRangeSeconds),timeSurrounded:balR(b.timeSurrounded),
   damageTakenWhilePresent:balR(b.damageTakenWhilePresent),
   remainingHpPct:b.status==='killed'?0:e?balR(100*e.hp/e.maxHp):null,
   durationSeconds:balR((b.killedAt??now)-b.spawnedAt)};
 });
 return {game:'Реликтовый рой',build:bal.build,reportType:'balance',
  created:bal.created,generated:new Date().toISOString(),notice:'Локальный диагностический отчёт; онлайн-передача возможна только с согласия игрока. Время в секундах игрового процесса; урон записан после ограничений по боссам. Данные по конкретному оружию — история выбора, а не отдельный DPS.',
  environment:{...bal.screen,graphicsQuality:bal.graphicsQuality},difficulty:bal.threat,
  result:bal.result||{status:'in_progress',seconds:now},
  totals:{...bal.totals,damageToBoss:balR(bal.totals.damageToBoss),
   damageToOthers:balR(bal.totals.damageToOthers),damageReceived:balR(bal.totals.damageReceived),bossDamageBlocked:balR(bal.totals.bossDamageBlocked)},
  bosses,choices:bal.choices,fusions:bal.fusions,timeline:bal.timeline,
  finalWeapons:S.drones.map(d=>({id:d.id,name:DRONES[d.id]?.name||d.id,level:d.lvl,mods:{...d.mods}})),
  events:bal.events,
  fpsSummary:typeof perfSummary==='function'?perfSummary():null};
}
function balStore(){try{const report=balReport();if(report){balLast=report;localStorage.setItem(BAL_STORE,JSON.stringify(report));if(!report.result)window.SwarmTelemetry?.sample?.(report,perf.samples)}}catch(err){console.warn('Balance report storage:',err)}}
function balFinalize(won,giveup){
 if(!bal||trainingMode)return;
 balSnapshot();bal.result={status:won?'win':giveup?'abandoned':'defeat',
  seconds:balR(S.t),level:S.lvl,kills:S.kills,score:S.score,playerHp:balR(S.player.hp),
  remainingBosses:S.bosses.filter(e=>e.hp>0).map(e=>({id:e.id,hpPct:balR(100*e.hp/e.maxHp)}))};
 bal.events.push({t:balR(S.t),what:'run_end',result:bal.result.status});balStore();window.SwarmTelemetry?.finish?.(balReport(),perf.samples);
}
function balPanelHTML(){
 const r=bal&&S?balReport():balLast;
 const t=r?.result?.seconds??r?.timeline?.at(-1)?.t??0;
 return `<div class="bal-tools"><strong>◈ АНАЛИТИКА БАЛАНСА</strong><p>${r?`Записано ${formatTime(t)} · урон боссам ${Math.round(r.totals.damageToBoss).toLocaleString('ru')} · пик врагов ${r.totals.peakEnemies} · получено ударов ${r.totals.receivedHits}`:'Пока нет данных. Запусти забег, статистика соберётся автоматически.'}</p><button type="button" class="btn primary" id="balExport" ${r?'':'disabled'}>↓ СКАЧАТЬ ОТЧЁТ БАЛАНСА</button><p class="tiny">Отчёт хранится на этом устройстве, пока не начнётся новый забег. Отчёт хранится локально. При разрешённой онлайн-аналитике анонимные данные также передаются на сервер.</p><textarea id="balReportText" hidden readonly aria-label="Отчёт баланса для копирования"></textarea></div>`;
}
function balExport(){
 const report=(mode==='menu'||(!S&&balLast))?balLast:balReport();if(!report)return;
 const json=JSON.stringify(report,null,2);
 try{const file=new Blob([json],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download='RelictSwarm_Balance_'+Date.now()+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}catch(err){console.warn('Balance download:',err)}
 const area=$('balReportText');if(area){area.value=json;area.hidden=false;}
}
document.addEventListener('click',e=>{if(e.target?.id==='balExport')balExport()});

