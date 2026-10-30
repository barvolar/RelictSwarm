const perf={on:true,lastRaf:0,bucketFrom:0,frames:0,intervals:[],updateMs:[],drawMs:[],audioMs:[],samples:[],startedAt:Date.now(),excludedLargeGaps:0};
function perfReset(){perf.lastRaf=0;perf.bucketFrom=0;perf.frames=0;perf.intervals=[];perf.updateMs=[];perf.drawMs=[];perf.audioMs=[];perf.samples=[];perf.startedAt=Date.now();perf.excludedLargeGaps=0;resetRenderAdaptation();perfShow();}
function perfShow(){} // Performance sampling is invisible.
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
 if(perf.samples.length>1000)perf.samples.shift();
 adjustRenderFidelity(perf.samples);

 perf.bucketFrom=now;perf.frames=0;perf.intervals=[];perf.updateMs=[];perf.drawMs=[];perf.audioMs=[];
}
