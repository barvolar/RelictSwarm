const renderQualityKey='relictswarm_render_quality';
let renderQuality='normal';
try{renderQuality=localStorage.getItem(renderQualityKey)==='eco'?'eco':'normal'}catch{}
function effectiveRenderDpr(){return Math.min(devicePixelRatio||1,(matchMedia('(pointer:coarse)').matches||'ontouchstart' in window)?(renderQuality==='eco'?1.25:2):2)}
function setRenderQuality(next){renderQuality=next==='eco'?'eco':'normal';try{localStorage.setItem(renderQualityKey,renderQuality)}catch{}resize()}
function resize(){W=innerWidth;H=innerHeight;scale=effectiveRenderDpr();C.width=Math.floor(W*scale);C.height=Math.floor(H*scale);C.style.width=W+'px';C.style.height=H+'px';cx.setTransform(scale,0,0,scale,0,0)}addEventListener('resize',resize,{passive:true});resize();
