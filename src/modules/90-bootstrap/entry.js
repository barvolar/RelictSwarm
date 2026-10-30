let lastRuntimeError='',lastRuntimeErrorAt=0;
function loop(now){
 requestAnimationFrame(loop); // Schedule next frame *before* updating; an exception must not silently freeze the browser game.
 try{
  let dt=Math.min(.039,Math.max(0,(now-last)/1000||.016));last=now;ambient+=dt;frame++;
   const perfPlaying=perf.on&&mode==='playing',cpuStart=perfPlaying?performance.now():0;
   if(mode==='playing')update(dt);
   const afterUpdate=perfPlaying?performance.now():0;
   draw();
   const afterDraw=perfPlaying?performance.now():0;
   updateSoundtrack();
   if(perfPlaying&&mode==='playing')perfTick(now,afterUpdate-cpuStart,afterDraw-afterUpdate,performance.now()-afterDraw);
   else if(mode!=='playing'){perf.lastRaf=0;perf.bucketFrom=0;perfShow();}
 }catch(err){
  const detail=err?.stack||String(err);console.error('[Relict Swarm] Game-loop error:',detail);
  if(detail===lastRuntimeError&&now-lastRuntimeErrorAt<2000)return;
  lastRuntimeError=detail;lastRuntimeErrorAt=now;
  if(mode==='playing'){
   setMode('paused');
   $('modalContent').innerHTML=`<div class="label danger">[ СБОЙ ИГРОВОГО ЦИКЛА ]</div><div class="panel-title">Забег приостановлен</div><p class="panel-desc">Произошла ошибка обновления игры. Время больше не зависнет молча. Можно продолжить или вернуться в ангар.</p><p class="tiny" style="overflow-wrap:anywhere">${String(err).replace(/[<>]/g,'')}</p><div class="button-row"><button class="btn primary" id="resumeBtn">▶ ПРОДОЛЖИТЬ</button><button class="btn ghost" id="quitBtn">ЗАВЕРШИТЬ ЗАБЕГ</button></div>`;
   $('resumeBtn').onclick=resume;$('quitBtn').onclick=()=>trainingMode?leaveTraining():finish(false,true);
  }
 }
}
// Minimal read-only debug bridge, enabled only with ?test=1. Not loaded from Yandex or network.
if(new URLSearchParams(location.search).has('test'))window.__test={state:()=>S,mode:()=>mode,skin:()=>save.skin,skinOwned:()=>save.skins.slice(),chooseSkin:id=>{if(SKINS[id]&&save.skins.includes(id)){save.skin=id;persist()}},threat:()=>S?.threat,events:()=>({boss:S?.bossFlags,synth:S?.synthFlags,raid:S?.raidFlags}),records:()=>save.records,setTime:t=>{if(S){S.t=t;S.spawn=0}},grant:n=>{if(S)gainXP(n)},damage:n=>{if(S)hitPlayer(n,0,0)},shards:n=>{if(S)S.shards+=n},killOmega:()=>{if(S){let b=S.bosses.find(e=>e.id==='omega');if(b){b.hp=-1;killEnemy(b)}}},killBoss:id=>{if(S){const e=S.enemy.find(e=>e.id===id);if(e){e.hp=-1;killEnemy(e)}}},finish:()=>S&&finish(true),fusionIds:()=>eligibleHybrids(),mods:id=>S?.drones.find(x=>x.id===id)?.mods||{},testMod:(id,key,n=1)=>{let d=S?.drones.find(x=>x.id===id),def=weaponBranches(id).find(x=>x[0]===key);if(d&&def){d.mods??={};d.mods[key]=wm(d,key)+n;updateHUD()}},saws:()=>{let d=S?.drones.find(x=>['saw','fusion_thermal','fusion_tesla'].includes(x.id));return d?sawPositions(d,S.drones.indexOf(d)).length:0},addCore:(n=1)=>{if(S){S.fusionCores+=n;updateHUD()}},pickFusion:id=>{if(S&&mode==='playing'&&eligibleHybrids().includes(id)){openForge();forgeHybrid(id)}},install:(id,rank=2)=>{if(!S||!DRONES[id])return;let d=S.drones.find(x=>x.id===id);if(!d&&S.drones.length>=MAX_WEAPONS)return;if(!d)S.drones.push(d={id,lvl:1,cd:0,hitCd:0,mods:{}});d.lvl=rank;updateHUD()},spawn:(id,x,y)=>{if(!S||!ENEMY[id])return;let e=spawnEnemy(id,0,200);if(e){e.x=x??S.player.x+120;e.y=y??S.player.y;}return e},chains:()=>S?.chains.length||0,powerup:(id)=>spawnPowerup(S.player.x+10,S.player.y+10,id),choose:(idx)=>chooseUpgrade(idx),forge:(id)=>{if(S&&mode==='playing'){openForge();forgeHybrid(id)}},frames:()=>frame,audio:()=>({enabled:audioSettings.on,sfx:audioSettings.sfx,music:audioSettings.music,state:audio?.state||'inactive',activeVoices,flameRunning:!!flameStream,flameLastShot}),playSfx:id=>sfx(id,1,true)};
setMode('menu');menu();requestAnimationFrame(loop);
})();



