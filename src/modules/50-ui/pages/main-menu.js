function skinSvgFallback(id){
 const s=SKINS[id]||SKINS.relict,rank=SKIN_RARITY_RANK[s.rarity]||0;
 const wing=rank?[-1,1].map(side=>{
  const shift=side<0?0:120,transform=side<0?'':'translate(120 0) scale(-1 1)';
  const reach=rank===1?14:rank===2?24:rank===3?28:37;
  return '<g transform="'+transform+'"><path d="M36 64 L'+(36-reach)+' '+(rank>=3?20:33)+
    ' L'+(27-reach)+' 47 L'+(36-reach*.7)+' 83 L41 89Z" fill="'+s.shell+
    '" stroke="'+s.edge+'" stroke-width="2.5"/>'+
    '<path d="M35 61 L'+(34-reach*.8)+' 45 L'+(31-reach*.75)+' 72 L44 83" fill="none" stroke="'+
    (rank>=2?s.core:s.trim)+'" stroke-width="'+(rank>=2?2.3:1.5)+'"/>'+
    (rank>=3?'<path d="M35 85 L'+(20-reach)+' 103 L'+(15-reach)+' 83 L38 73" fill="'+s.back+
      '" stroke="'+s.core+'" stroke-width="2"/>':'')+'</g>';
 }).join(''):'';
 const halo=rank>=3?'<g class="skin-rotator" style="transform-origin:60px 70px" fill="none" stroke="'+s.trim+'">'+
  '<circle cx="60" cy="70" r="'+(rank===4?49:39)+'" stroke-dasharray="'+(rank===4?'15 11':'22 16')+'" stroke-width="2.5"/>'+
  (rank===4?'<circle cx="60" cy="70" r="35" stroke="'+s.core+'" stroke-dasharray="13 9" stroke-width="2"/>':'')+'</g>':'';
 const glow=rank>=2?'<circle cx="60" cy="70" r="'+(rank===4?43:33)+'" fill="'+s.core+'" opacity=".12"/>':'';
 return '<svg viewBox="0 0 120 150" class="skin-art" role="img" aria-label="Облик '+s.name+'">'+
 '<ellipse cx="60" cy="128" rx="33" ry="10" fill="'+s.core+'" opacity=".12"/>'+
 glow+wing+
 '<g stroke-linejoin="round"><path d="M42 71 29 84 34 105 47 106 53 91 M78 71 91 84 86 105 73 106 67 91" fill="'+s.back+'" stroke="'+s.edge+'" stroke-width="2.5"/>'+
 '<path d="M60 22 78 29 86 64 75 99 60 110 45 99 34 64 42 29Z" fill="'+s.body+'" stroke="'+s.edge+'" stroke-width="3"/>'+
 '<path d="M60 30 74 36 75 53 60 49 45 53 46 36Z" fill="'+s.plate+'"/>'+
 '<path d="M39 66 51 51 60 61 69 51 81 66 72 88 60 94 48 88Z" fill="'+s.shell+'" stroke="'+s.trim+'" stroke-width="2"/>'+
 '<path d="M47 69 60 53 73 69 67 86 53 86Z" fill="'+s.coreDark+'" stroke="'+s.light+'" stroke-width="2.3"/>'+
 '<path d="M60 60 68 70 64 80 56 80 52 70Z" fill="'+s.core+'"/><circle cx="60" cy="68" r="3" fill="'+s.light+'"/>'+
 '</g>'+halo+'</svg>';
}
// A preview is a real screenshot of the same Canvas robot renderer used in combat.
// The old hand-drawn SVG is a fallback for non-Canvas/test environments only.
const SKIN_PREVIEW_CACHE=new Map();
function skinSvg(id){
 const key=SKINS[id]?id:'relict';
 const skin=SKINS[key];
 if(typeof document==='undefined'||typeof cx==='undefined'||!document.createElement)return skinSvgFallback(key);
 let png=SKIN_PREVIEW_CACHE.get(key);
 if(!png){
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=360; // 2x the 160x180 logical preview
  const previewCtx=canvas.getContext('2d',{alpha:true});
  if(!previewCtx)return skinSvgFallback(key);
  const liveCtx=cx,liveOverride=skinVisualOverride;
  try{
   cx=previewCtx;skinVisualOverride=skin;
   previewCtx.setTransform(2,0,0,2,0,0);
   previewCtx.translate(80,90);
   previewCtx.scale(1.65,1.65);
   drawRobot({x:0,y:0,dx:0,dy:-1,inv:0},true);
   png=canvas.toDataURL('image/png');
   SKIN_PREVIEW_CACHE.set(key,png);
  }catch(error){
   console.error('[Relict Swarm] Skin preview render failed:',key,error);
  }finally{
   cx=liveCtx;skinVisualOverride=liveOverride;
  }
 }
 return png?'<img class="skin-art skin-canvas-preview" src="'+png+'" width="160" height="180" alt="'+skin.name+'">':skinSvgFallback(key);
}
function menu(){
 setMode('menu');
 const skin=equippedSkin();
 $('modalContent').innerHTML=`<div class="main-home"><div class="home-unit">${skinSvg(save.skin)}<div><span class="label">АКТИВНАЯ ОБОЛОЧКА</span><strong>${skin.name}</strong><small>✧ ${save.shards} кристаллов · лучший счёт ${save.best.toLocaleString('ru')}</small></div></div><div class="home-actions"><button id="mainPlay" class="btn primary home-btn">▶ ИГРАТЬ</button><button id="mainUpgrade" class="btn home-btn">⬡ ПРОКАЧКА</button><button id="mainSettings" class="btn home-btn">⚙ НАСТРОЙКИ</button><button id="mainFullscreen" type="button" class="btn ghost home-btn home-fullscreen">${fullscreenButtonText()}</button></div></div>`;
 $('mainPlay').onclick=showPlayMenu;
 $('mainUpgrade').onclick=()=>showProgression('upgrades');
 $('mainSettings').onclick=showSettings;
 $('mainFullscreen').onclick=toggleFullscreen;
}
