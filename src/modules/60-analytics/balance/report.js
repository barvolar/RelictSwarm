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
