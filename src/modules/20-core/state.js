let trainingMode=false,trainingSelected='pulse',trainingThreat='dummies',trainingPanelOpen=true,trainingRecord={damage:0,hits:[],lastDps:0},trainingRespawn=0;
// Cosmetic looks: saved separately from weapon stats, hull, and progression.
const SKINS={
 relict:{name:'РЕЛИКТ',detail:'Исходная боевая оболочка',cost:0,free:true,body:'#12263a',plate:'#7a9fac',edge:'#5c94a3',shell:'#21394f',back:'#2f5366',trim:'#d59a54',core:'#50f2db',coreDark:'#1b9a9e',light:'#d8ffff',variant:'classic'},
 ghost:{name:'КОБАЛЬТОВЫЙ ПРИЗРАК',detail:'Синие эмиттеры и боковые крылья',cost:0,free:true,body:'#10274c',plate:'#79aaf0',edge:'#a1d9ff',shell:'#1e3d63',back:'#264775',trim:'#bddaff',core:'#5caaff',coreDark:'#3364c6',light:'#e8f7ff',variant:'ghost'},
 ember:{name:'ПЕПЕЛЬНЫЙ ОХОТНИК',detail:'Броня цвета лавы и огненные рога',cost:100,free:false,body:'#432524',plate:'#c86d48',edge:'#ffae76',shell:'#512c28',back:'#67392d',trim:'#ffd187',core:'#ff773d',coreDark:'#bc4428',light:'#fff0c2',variant:'ember'},
 void:{name:'ТЁМНЫЙ ПРОТОКОЛ',detail:'Чёрная броня и фиолетовые шипы',cost:250,free:false,body:'#1b172d',plate:'#72608e',edge:'#bda6ff',shell:'#2a2448',back:'#3f345b',trim:'#e1c6ff',core:'#bd7aff',coreDark:'#7640ae',light:'#f8eaff',variant:'void'}
};
function ownedSkins(raw){const list=Array.isArray(raw)?raw:[];return [...new Set(['relict','ghost',...list.filter(id=>SKINS[id])])];}
function equippedSkin(){return SKINS[save.skin]||SKINS.relict;}
let save=readSave(),mode='menu',S=null,W=innerWidth,H=innerHeight,scale=Math.min(devicePixelRatio||1,2),frame=0,last=0,ambient=0,shake=0,runId=0,menuStars=[],audio=null,mute=false,showToastUntil=0,showBannerUntil=0;
function readSave(){try{let v=JSON.parse(localStorage.getItem(saveKey)||'null');if(v && typeof v==='object')return {shards:Math.max(0,+v.shards||0),best:+v.best||0,runs:+v.runs||0,wins:+v.wins||0,meta:{hull:0,power:0,magnet:0,regen:0,...v.meta},recipes:{...v.recipes},skins:ownedSkins(v.skins),skin:ownedSkins(v.skins).includes(v.skin)?v.skin:'relict',threatUnlocked:Math.max(1,Math.min(5,Math.floor(v.threatUnlocked||1))),records:Array.isArray(v.records)?v.records.filter(r=>r&&Number.isFinite(+r.score)).slice(0,20):[]}}catch{}return {shards:0,best:0,runs:0,wins:0,meta:{hull:0,power:0,magnet:0,regen:0},recipes:{},skins:['relict','ghost'],skin:'relict',threatUnlocked:1,records:[]}}
function persist(){try{localStorage.setItem(saveKey,JSON.stringify(save))}catch{}}
function rand(a,b){return a+Math.random()*(b-a)}function rint(a,b){return Math.floor(rand(a,b+1))}const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}function hypot(x,y){return Math.hypot(x,y)||1}const TAU=Math.PI*2;function lerp(a,b,t){return a+(b-a)*t}
// v0.10.12 A/B graphics test: only backing-canvas resolution changes. World zoom and gameplay stay identical.
const renderQualityKey='relictswarm_render_quality';
let renderQuality='normal';
try{renderQuality=localStorage.getItem(renderQualityKey)==='eco'?'eco':'normal'}catch{}
function effectiveRenderDpr(){return Math.min(devicePixelRatio||1,(matchMedia('(pointer:coarse)').matches||'ontouchstart' in window)?(renderQuality==='eco'?1.25:2):2)}
function setRenderQuality(next){renderQuality=next==='eco'?'eco':'normal';try{localStorage.setItem(renderQualityKey,renderQuality)}catch{}resize()}
function resize(){W=innerWidth;H=innerHeight;scale=effectiveRenderDpr();C.width=Math.floor(W*scale);C.height=Math.floor(H*scale);C.style.width=W+'px';C.style.height=H+'px';cx.setTransform(scale,0,0,scale,0,0)}addEventListener('resize',resize,{passive:true});resize();
