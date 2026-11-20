function ownedSkins(raw){const list=Array.isArray(raw)?raw:[];return [...new Set(['relict','ghost',...list.filter(id=>SKINS[id])])];}
function equippedSkin(){return SKINS[save.skin]||SKINS.relict;}
let save=readSave(),mode='menu',S=null,W=innerWidth,H=innerHeight,scale=Math.min(devicePixelRatio||1,2),frame=0,last=0,ambient=0,shake=0,runId=0,menuStars=[],audio=null,mute=false,showToastUntil=0,showBannerUntil=0;
function readSave(){try{
 const raw=typeof window!=='undefined'&&window.RelicPlatform?.readStored?window.RelicPlatform.readStored(saveKey):localStorage.getItem(saveKey);
 // Bridge Storage can deserialize JSON automatically; tolerate either shape.
 const v=typeof raw==='string'?JSON.parse(raw):raw;
if(v && typeof v==='object')return {shards:Math.max(0,+v.shards||0),best:+v.best||0,runs:+v.runs||0,wins:+v.wins||0,meta:Object.fromEntries(META.map(m=>[m.id,Math.min(m.max,Math.max(0,Math.floor(Number(v.meta?.[m.id])||0)))])),recipes:{...v.recipes},skins:ownedSkins(v.skins),skin:ownedSkins(v.skins).includes(v.skin)?v.skin:'relict',threatUnlocked:Math.max(1,Math.min(5,Math.floor(v.threatUnlocked||1))),records:Array.isArray(v.records)?v.records.filter(r=>r&&Number.isFinite(+r.score)).slice(0,20):[]}}catch{}return {shards:0,best:0,runs:0,wins:0,meta:Object.fromEntries(META.map(m=>[m.id,0])),recipes:{},skins:['relict','ghost'],skin:'relict',threatUnlocked:1,records:[]}}
function persist(){try{const value=JSON.stringify(save);if(typeof window!=='undefined'&&window.RelicPlatform?.writeStored)window.RelicPlatform.writeStored(saveKey,value);else localStorage.setItem(saveKey,value)}catch(error){console.warn('[Save] Progress not saved',error)}}
function rand(a,b){return a+Math.random()*(b-a)}function rint(a,b){return Math.floor(rand(a,b+1))}const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}function hypot(x,y){return Math.hypot(x,y)||1}const TAU=Math.PI*2;function lerp(a,b,t){return a+(b-a)*t}
// v0.10.12 A/B graphics test: only backing-canvas resolution changes. World zoom and gameplay stay identical.
