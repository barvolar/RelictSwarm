// Four graphics presets. Gameplay and enemy simulation never depend on visual quality.
const renderQualityKey='relictswarm_render_quality';
const RENDER_PRESETS=[
 {id:'high',name:'HIGH',desc:'Full detail, maximum effects and resolution.'},
 {id:'normal',name:'NORMAL',desc:'Detailed enemies and balanced effects.'},
 {id:'low',name:'LOW',desc:'Detailed enemies, fewer glows and particles.'},
 {id:'minimal',name:'MINIMAL',desc:'Simplified enemy silhouettes and minimal rendering load.'}
];
let renderQuality='normal';
try{
 const stored=localStorage.getItem(renderQualityKey);
 // Old ECO upgrades to LOW instead of unexpectedly replacing enemies with polygons.
 renderQuality=stored==='eco'?'low':RENDER_PRESETS.some(p=>p.id===stored)?stored:'normal';
}catch{}
let adaptiveRenderScale=1,adaptiveRenderLastChange=-100;
function renderSimplifyEnemies(){return renderQuality==='minimal'}
function renderIsLite(){return renderQuality==='low'||renderQuality==='minimal'||adaptiveRenderScale<.99}
function renderGlowFactor(){return renderQuality==='high'?1:renderQuality==='normal'?.85:renderQuality==='low'?.4:0}
function renderEffectDensity(){
 const base=renderQuality==='high'?1.2:renderQuality==='normal'?1:renderQuality==='low'?.55:.32;
 return base*(adaptiveRenderScale<.99?.8:1);
}
function effectiveRenderDpr(){
 const dpr=Math.min(devicePixelRatio||1,2);
 const caps={high:2,normal:1.6,low:1.05,minimal:.8};
 const presetCap=caps[renderQuality]||1.6;
 const desktopRatio=renderQuality==='low'?.9:renderQuality==='minimal'?.72:1;
 return Math.max(.5,Math.min(dpr*desktopRatio,presetCap)*adaptiveRenderScale);
}
function setRenderQuality(next){
 if(!RENDER_PRESETS.some(p=>p.id===next))return;
 renderQuality=next;adaptiveRenderScale=1;adaptiveRenderLastChange=-100;
 try{localStorage.setItem(renderQualityKey,renderQuality)}catch{}
 if(typeof bal!=='undefined'&&bal)bal.graphicsQuality=renderQuality;
 resize();
}
function resetRenderAdaptation(){adaptiveRenderScale=1;adaptiveRenderLastChange=-100;resize()}
function adjustRenderFidelity(samples){
 if(!S||samples.length<5)return;
 const current=samples[samples.length-1],time=current.elapsedGameSec||0;
 if(time-adaptiveRenderLastChange<8)return;
 const recent=samples.slice(-5);
 if(recent.some(x=>!Number.isFinite(x.fps)))return;
 const fps=recent.reduce((a,x)=>a+x.fps,0)/recent.length;
 const enemies=recent.reduce((a,x)=>a+(x.enemies||0),0)/recent.length;
 let target=adaptiveRenderScale;
 if(enemies>=70&&fps<19)target=.65;
 else if(enemies>=35&&fps<31)target=.75;
 else if(enemies>=25&&fps<43)target=.85;
 else if(fps>56&&recent.every(x=>x.fps>50))target=1;
 if(target===adaptiveRenderScale)return;
 if(target>adaptiveRenderScale&&recent.some(x=>x.fps<50))return;
 adaptiveRenderScale=target;adaptiveRenderLastChange=time;resize();
}
function resize(){
 W=innerWidth;H=innerHeight;scale=effectiveRenderDpr();
 C.width=Math.max(1,Math.floor(W*scale));C.height=Math.max(1,Math.floor(H*scale));
 C.style.width=W+'px';C.style.height=H+'px';cx.setTransform(scale,0,0,scale,0,0);
}
addEventListener('resize',resize,{passive:true});resize();
