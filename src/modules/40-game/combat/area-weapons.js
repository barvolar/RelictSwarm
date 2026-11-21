// A prism well damages nearby enemies with clear, timed laser volleys.
// Choose targets at pulse time: newly pulled enemies can be hit, dead targets
// are ignored, bosses can be hit but are never dragged by the gravity effect.
function prismWellVolley(g){
 const reach=g.r*1.25;
 const targets=S.enemy.filter(e=>e.hp>0&&Math.hypot(e.x-g.x,e.y-g.y)<=reach+(e.r||0))
  .sort((a,b)=>((a.x-g.x)**2+(a.y-g.y)**2)-((b.x-g.x)**2+(b.y-g.y)**2))
  .slice(0,g.prismBeams);
 for(const e of targets){
  // Visual rays get priority over older cosmetic particles when the FX pool
  // is crowded. This never changes how much gameplay damage is dealt.
  if(S.fx.length>=160)S.fx.splice(0,S.fx.length-159);
  S.fx.push({type:'beam',a:{x:g.x,y:g.y},b:{x:e.x,y:e.y},
   life:.28,max:.28,col:g.col,width:3.5});
  hurtEnemy(e,g.prismDamage,{slow:.35});
 }
}
function updateAreaWeapons(dt){
 for(const mine of S.mines){mine.life-=dt;mine.arm-=dt;if(mine.arm>0)continue;
  if(mine.gravityMine&&!(S.timeStopTimer>0))for(const e of S.enemy){if(e.hp<=0||e.elite)continue;const dx=mine.x-e.x,dy=mine.y-e.y,dd=Math.hypot(dx,dy);if(dd<mine.gravRadius&&dd>5){e.x+=dx/dd*mine.force*dt;e.y+=dy/dd*mine.force*dt;}}
  const e=closest(mine.x,mine.y,28);if(e){sfx('explosion',mine.gravityMine?1:.7);damageArea(mine.x,mine.y,mine.blast,mine.damage,{color:mine.col,knock:16,burn:mine.specialMine==='ice'?0:.5,slow:mine.specialMine==='ice'?3:0,stun:mine.specialMine==='ice'?.5+(mine.freezeStrength||0)*.13:0});if(mine.specialMine==='ice')fusionField(mine.x,mine.y,mine.blast*.8,mine.damage*.10,2.5,'#a3ebff',{ice:true,chill:12+(mine.freezeStrength||0)*5});mine.life=-1;S.fx.push({type:'ring',x:mine.x,y:mine.y,r:mine.blast,life:.5,max:.5,col:mine.col});shake=Math.max(shake,3)}
 }S.mines=S.mines.filter(m=>m.life>0);
 for(const g of S.gravityWells){g.life-=dt;g.clock-=dt;if(g.life<=0&&!g.collapsed){g.collapsed=true;sfx('gravityCollapse',.65);if(g.coldCollapse){damageArea(g.x,g.y,g.r,g.coldCollapse,{color:'#a9edff',slow:2,stun:.35});for(const foe of [...S.enemy])if(foe.hp>0&&Math.hypot(foe.x-g.x,foe.y-g.y)<g.r){shatterFrozen(foe,g.coldCollapse*.55,56);if(foe.hp>0)applyChill(foe,45);}}}
  if(!(S.timeStopTimer>0))for(const e of S.enemy){if(e.hp<=0||e.elite)continue;const dx=g.x-e.x,dy=g.y-e.y,d=Math.hypot(dx,dy);if(d<g.r&&d>8){const force=g.force*(.45+.55*(1-d/g.r));e.x+=dx/d*force*dt;e.y+=dy/d*force*dt;e.slow=Math.max(e.slow,.12);}}
  if(g.life>0&&g.prism){
   g.prismClock-=dt;
   if(g.prismClock<=0){g.prismClock=.58;prismWellVolley(g);}
  }
  if(g.clock<=0){g.clock=.27;for(const e of S.enemy){if(e.hp>0&&Math.hypot(e.x-g.x,e.y-g.y)<e.r+g.r)hurtEnemy(e,g.damage,{slow:.22})}}
 }S.gravityWells=S.gravityWells.filter(g=>g.life>0);
}
