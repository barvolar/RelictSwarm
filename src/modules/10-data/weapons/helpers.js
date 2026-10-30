const wm=(d,key)=>d?.mods?.[key]||0;
const branchPoints=d=>Object.values(d?.mods||{}).reduce((a,b)=>a+b,0);
const MAX_WEAPONS=5;
const BASE_WEAPONS=Object.keys(DRONES).filter(id=>!id.startsWith('fusion_'));
function weaponBranches(id){return WEAPON_MODS[id]||[]}
function modDesc(id,key,level){const entry=weaponBranches(id).find(m=>m[0]===key);return entry?`${entry[1]} +${level} · ${entry[2]}`:''}
function sawPositions(d,i){const n=Math.min(10,1+wm(d,'count')),r=Math.min(310,Math.max(69+wm(d,'radius')*19,n*21)),spin=S.t*(1.9*(1+Math.log1p(wm(d,'spin'))*.7)),base=i*TAU/Math.max(1,S.drones.length)-Math.PI/2;return Array.from({length:n},(_,k)=>{const a=spin+k*TAU/n+base;return{x:S.player.x+Math.cos(a)*r,y:S.player.y+Math.sin(a)*r,a}})}
function hybridIs(id){return S.hybrids.some(h=>h.id===id)}
function modHealthText(d){return d?`УР. ${d.lvl} · готов к синтезу`:'не получен'}

