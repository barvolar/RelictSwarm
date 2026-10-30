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
