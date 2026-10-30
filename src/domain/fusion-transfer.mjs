// Build a fused weapon without changing the two source weapons or the game state.
export function createFusionWeapon(id, a, b, branches) {
 const mods={};
 for(const [key] of branches)mods[key]=Math.floor(((a.mods?.[key]||0)+(b.mods?.[key]||0))*.65);
 const level=Math.max(1,Math.floor((a.lvl+b.lvl)/2));
 return {id:'fusion_'+id,lvl:level,mods,cd:.2,hitCd:0};
}
