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
