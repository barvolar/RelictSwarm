// Fusion must preserve progression paid for by BOTH consumed weapons.
// Matched modifiers keep their full points, unmatched branches are converted
// into universal power / attack tempo instead of vanishing.
export function createFusionWeapon(id, a, b, branches) {
 const keys=branches.map(([key])=>key);
 const mods=Object.fromEntries(keys.map(key=>[key,Math.max(0,(a.mods?.[key]||0)+(b.mods?.[key]||0))]));
 const sourcePoints=[a,b].reduce((n,d)=>n+Object.values(d.mods||{}).reduce((s,v)=>s+Math.max(0,v||0),0),0);
 const retained=Object.values(mods).reduce((s,v)=>s+v,0);
 const extra=Math.max(0,sourcePoints-retained);
 const power=keys.includes('power')?'power':keys[0];
 const tempo=keys.includes('rate')?'rate':power;
 if(power===tempo)mods[power]=(mods[power]||0)+extra;
 else{
  mods[power]=(mods[power]||0)+Math.ceil(extra*.65);
  mods[tempo]=(mods[tempo]||0)+Math.floor(extra*.35);
 }
 // The two paid weapon levels now survive the merge.
 const lvl=Math.max(1,Math.floor(a.lvl||1)+Math.floor(b.lvl||1)-1);
 return {id:'fusion_'+id,lvl,mods,cd:.2,hitCd:0};
}
