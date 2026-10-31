function eligibleHybrids(){return eligibleFusionIds(S,HYBRIDS);}
function rarityRoll(){
 // Keep the original 60/27/10/3 distribution when no research has been purchased.
 const research=metaBonus('rarity');
 const weights=RARITIES.map(r=>r.chance+(r.id==='common'?-.6:r.id==='uncommon'?.3:r.id==='rare'?.2:.1)*research);
 let k=rand(0,weights.reduce((a,v)=>a+v,0));
 for(let i=0;i<RARITIES.length;i++){k-=weights[i];if(k<=0)return RARITIES[i]}
 return RARITIES[0];
}
function upgradeChoices(){
 const pool=[];
 for(const id of Object.keys(DRONES)){
  const d=S.drones.find(x=>x.id===id);
  if(!d){if(BASE_WEAPONS.includes(id)&&S.drones.length<MAX_WEAPONS)pool.push({kind:'new',id,weight:4.5});}
  else {const rarity=rarityRoll(),keys=weaponBranches(id).map(b=>b[0]).sort(()=>Math.random()-.5).slice(0,rarity.steps);pool.push({kind:'weapon',id,rarity,keys,weight:7.2});}
 }
 // v0.10.10: support modules should be a meaningful option, not an ~5% lottery.
  // A repair pack appears only when at least 24 hull points are missing.
  for(const id of ['damage','speed','hp','cooldown','magnet','heal']){
    if(id==='heal' && S.player.hp>S.player.maxHp-24)continue;
    pool.push({kind:'stat',id,weight:2.2});
  }
 const out=[];
 while(out.length<3&&pool.length){let sum=pool.reduce((a,o)=>a+o.weight,0),r=rand(0,sum),chosen=pool[pool.length-1];for(const o of pool){r-=o.weight;if(r<=0){chosen=o;break}}
  out.push(chosen);pool.splice(pool.indexOf(chosen),1);
 }
 return out;
}
// The card shows individual effects, not a prose string joining unrelated stats.
