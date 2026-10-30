const renderQualityKey='relictswarm_render_quality';
let renderQuality='normal';
try{renderQuality=localStorage.getItem(renderQualityKey)==='eco'?'eco':'normal'}catch{}
// Resolution is a rendering-only budget. Never change enemy counts, collision or weapon damage.
let adaptiveRenderScale=1,adaptiveRenderLastChange=-100;
function renderIsLite(){return renderQuality==='eco'||adaptiveRenderScale<.99}
function effectiveRenderDpr(){
 const touch=matchMedia('(pointer:coarse)').matches||'ontouchstart' in window;
 const base=Math.min(devicePixelRatio||1,touch?(renderQuality==='eco'?1.25:2):2);
 const ecoCap=renderQuality==='eco'?(touch?1.0:.8):base;
 return Math.max(.5,Math.min(base,ecoCap)*adaptiveRenderScale);
}
function setRenderQuality(next){renderQuality=next==='eco'?'eco':'normal';adaptiveRenderScale=1;adaptiveRenderLastChange=-100;try{localStorage.setItem(renderQualityKey,renderQuality)}catch{}resize()}
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
 // Recover only after sustained headroom: prevents resolution oscillation.
 if(target>adaptiveRenderScale&&recent.some(x=>x.fps<50))return;
 adaptiveRenderScale=target;adaptiveRenderLastChange=time;resize();
}
function resize(){W=innerWidth;H=innerHeight;scale=effectiveRenderDpr();C.width=Math.max(1,Math.floor(W*scale));C.height=Math.max(1,Math.floor(H*scale));C.style.width=W+'px';C.style.height=H+'px';cx.setTransform(scale,0,0,scale,0,0)}
addEventListener('resize',resize,{passive:true});resize();
