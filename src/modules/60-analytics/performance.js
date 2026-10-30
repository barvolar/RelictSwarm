const PERF_KEY='relictSwarm_perf_test_on';
const perf={on:true,lastRaf:0,bucketFrom:0,frames:0,intervals:[],updateMs:[],drawMs:[],audioMs:[],samples:[],startedAt:Date.now(),excludedLargeGaps:0};
try{perf.on=localStorage.getItem(PERF_KEY)!=='off'}catch{}
function perfReset(){perf.lastRaf=0;perf.bucketFrom=0;perf.frames=0;perf.intervals=[];perf.updateMs=[];perf.drawMs=[];perf.audioMs=[];perf.samples=[];perf.startedAt=Date.now();perf.excludedLargeGaps=0;perfShow();}
function perfShow(){const box=$('perfOverlay');if(box)box.style.display=perf.on&&mode==='playing'?'block':'none';}
function perfSnapshot(){
 if(!S)return {enemies:0,enemyBullets:0,shots:0,fx:0,parts:0,pickups:0,hazards:0,mines:0,chains:0};
 return {enemies:S.enemy?.length||0,enemyBullets:S.enemyBullets?.length||0,shots:S.bullets?.length||0,fx:(S.fx?.length||0)+(S.effects?.length||0)+(S.floaters?.length||0),parts:S.parts?.length||0,pickups:S.pickups?.length||0,hazards:(S.hazards?.length||0)+(S.gravityWells?.length||0),mines:S.mines?.length||0,chains:S.chains?.length||0};
}
function perfAvg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function perfPercentile(a,p){if(!a.length)return 0;const v=a.slice().sort((x,y)=>x-y);return v[Math.min(v.length-1,Math.ceil(v.length*p)-1)]}
function perfTick(now,msUpdate,msDraw,msAudio){
 if(!perf.on||mode!=='playing'||document.hidden){perf.lastRaf=0;perf.bucketFrom=0;return;}
 if(!perf.bucketFrom)perf.bucketFrom=now;
 if(perf.lastRaf){const dt=now-perf.lastRaf;if(dt>0&&dt<1500)perf.intervals.push(dt);else perf.excludedLargeGaps++;}
 perf.lastRaf=now;perf.frames++;
 perf.updateMs.push(msUpdate);perf.drawMs.push(msDraw);perf.audioMs.push(msAudio);
 if(now-perf.bucketFrom<1000)return;
 const elapsed=(now-perf.bucketFrom)/1000;
 const intervals=perf.intervals;
 const counts=perfSnapshot();
 const sample={elapsedGameSec:Math.round((S?.t||0)*10)/10,wallClock:Date.now(),renderQuality,renderDpr:+scale.toFixed(2),canvasPixels:C.width*C.height,fps:+(perf.frames/elapsed).toFixed(1),frameP95ms:+perfPercentile(intervals,.95).toFixed(1),frameP99ms:+perfPercentile(intervals,.99).toFixed(1),slowFrames33:intervals.filter(v=>v>33.3).length,slowFrames50:intervals.filter(v=>v>50).length,cpuUpdateMs:+perfAvg(perf.updateMs).toFixed(2),cpuDrawMs:+perfAvg(perf.drawMs).toFixed(2),cpuAudioMs:+perfAvg(perf.audioMs).toFixed(2),...counts};
 perf.samples.push(sample);
 const box=$('perfOverlay');if(box){
  const level=sample.fps<35?'perf-bad':sample.fps<50?'perf-warning':'';
  box.innerHTML=`<div class="perf-caption">FPS ТЕСТ · 10.15 · ${renderQuality==='eco'?'ЭКО':'ОБЫЧ.'}</div><div class="perf-main"><span>FPS</span><b class="${level}">${sample.fps.toFixed(0)}</b><span>p95 ${sample.frameP95ms.toFixed(0)} мс</span></div><div class="perf-info">CPU: логика ${sample.cpuUpdateMs.toFixed(1)} · графика ${sample.cpuDrawMs.toFixed(1)} мс</div><div class="perf-info">Враги ${counts.enemies} · пули ${counts.shots+counts.enemyBullets} · FX ${counts.fx+counts.parts}</div><div class="perf-info">Кадров >33 мс: ${sample.slowFrames33} / ${intervals.length}</div>`;
  const dock=$('hud')?.querySelector('.hud-dock');box.style.top=Math.max(10,Math.round((dock?.getBoundingClientRect().bottom||106)+7))+'px';
 }
 perf.bucketFrom=now;perf.frames=0;perf.intervals=[];perf.updateMs=[];perf.drawMs=[];perf.audioMs=[];
}
function perfSummary(){
 const samples=perf.samples;
 if(!samples.length)return 'Пока нет записанных данных. Запусти забег с включённым FPS-тестом.';
 let min=samples.reduce((a,b)=>a.fps<b.fps?a:b);
 const totalSlow=samples.reduce((a,b)=>a+b.slowFrames33,0);
 return `Секунд наблюдения: ${samples.length}. Средний FPS: ${perfAvg(samples.map(s=>s.fps)).toFixed(1)}, худшая секунда: ${min.fps} FPS (${formatTime(min.elapsedGameSec)}). P95 времени кадра в худшую секунду: ${min.frameP95ms} мс. Медленных кадров >33 мс: ${totalSlow}.`;
}
function perfReport(){
 return {game:'Реликтовый рой',build:'0.10.15-online-test',generatedAt:new Date().toISOString(),description:'FPS = фактические кадры в секунду. P95/P99 рассчитаны по интервалам requestAnimationFrame. CPU update/draw = JS-время, не измеряет GPU.',userAgent:navigator.userAgent,screen:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio||1,canvasWidth:C.width,canvasHeight:C.height},level:S?.lvl||null,threat:S?.threat||null,enabled:perf.on,renderQuality,summary:perfSummary(),excludedGaps:perf.excludedLargeGaps,samples:perf.samples};
}
function perfDownload(){
 const report=JSON.stringify(perfReport(),null,2);
 try{const blob=new Blob([report],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='RelictSwarm_FPS_Report_'+Date.now()+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}catch(err){console.warn('FPS report download:',err)}
 const ta=$('perfReportText');if(ta){ta.value=report;ta.hidden=false;}
}
function renderQualityControls(){return `<div class="perf-quality" style="padding:10px 0;display:grid;gap:6px"><strong>КАЧЕСТВО ГРАФИКИ · ТЕСТ</strong><p style="margin:0">Только для телефона. «Обычное» сохраняет качество предыдущей версии; «ЭКО» снижает внутреннее разрешение Canvas без изменения размеров, урона и количества врагов. Можно менять в паузе, запись FPS продолжится.</p><button type="button" class="btn" id="qualityToggle">${renderQuality==='eco'?'◉ ЭКО (1.25×) · ПЕРЕКЛЮЧИТЬ':'◉ ОБЫЧНОЕ (2×) · ПЕРЕКЛЮЧИТЬ'}</button></div>`}
function perfSettingsHTML(){return `<div class="perf-tools"><strong>▥ ДИАГНОСТИКА ПРОИЗВОДИТЕЛЬНОСТИ</strong><p>Записывает FPS и нагрузку только во время забега. Настройки игры и баланс не изменяет.</p>${renderQualityControls()}<div class="perf-actions"><button class="btn" id="perfToggle">${perf.on?'✓ FPS ТЕСТ ВКЛ':'○ FPS ТЕСТ ВЫКЛ'}</button><button class="btn ghost" id="perfExport">↓ СОХРАНИТЬ ОТЧЁТ</button></div><p>${perfSummary()}</p><textarea id="perfReportText" hidden readonly aria-label="Текст отчёта для копирования"></textarea><p>Для сравнения лучше пройти 3–5 минут с одинаковым оружием. При просадке сделай скриншот счётчика.</p></div>`}
function bindPerfSettings(){
 const btn=$('perfToggle');if(btn)btn.onclick=()=>{perf.on=!perf.on;try{localStorage.setItem(PERF_KEY,perf.on?'on':'off')}catch{}perfShow();showSettings()};
 // Click delegation handles perfExport in settings, pause and results.
}
function perfPauseHTML(){return `<div class="perf-tools"><strong>▥ FPS ТЕСТ</strong><p>${perfSummary()}</p>${renderQualityControls()}<div class="perf-actions"><button type="button" class="btn ghost" id="perfExport">↓ СОХРАНИТЬ ОТЧЁТ</button></div><textarea id="perfReportText" hidden readonly aria-label="Текст отчёта для копирования"></textarea></div>`}
document.addEventListener('click',e=>{if(e.target?.id==='perfExport')perfDownload();if(e.target?.id==='qualityToggle'){setRenderQuality(renderQuality==='normal'?'eco':'normal');e.target.textContent=renderQuality==='eco'?'◉ ЭКО (1.25×) · ПЕРЕКЛЮЧИТЬ':'◉ ОБЫЧНОЕ (2×) · ПЕРЕКЛЮЧИТЬ';}});
addEventListener('visibilitychange',()=>{perf.lastRaf=0;perf.bucketFrom=0;});

