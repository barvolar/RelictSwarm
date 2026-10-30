function updateAreaWeapons(dt){
 for(const mine of S.mines){mine.life-=dt;mine.arm-=dt;if(mine.arm>0)continue;
  if(mine.gravityMine)for(const e of S.enemy){if(e.hp<=0||e.elite)continue;const dx=mine.x-e.x,dy=mine.y-e.y,dd=Math.hypot(dx,dy);if(dd<mine.gravRadius&&dd>5){e.x+=dx/dd*mine.force*dt;e.y+=dy/dd*mine.force*dt;}}
  const e=closest(mine.x,mine.y,28);if(e){sfx('explosion',mine.gravityMine?1:.7);damageArea(mine.x,mine.y,mine.blast,mine.damage,{color:mine.col,knock:16,burn:mine.specialMine==='ice'?0:.5,slow:mine.specialMine==='ice'?3:0,stun:mine.specialMine==='ice'?.5:0});if(mine.specialMine==='ice')fusionField(mine.x,mine.y,mine.blast*.8,mine.damage*.10,2.5,'#a3ebff');mine.life=-1;S.fx.push({type:'ring',x:mine.x,y:mine.y,r:mine.blast,life:.5,max:.5,col:mine.col});shake=Math.max(shake,3)}
 }S.mines=S.mines.filter(m=>m.life>0);
 for(const g of S.gravityWells){g.life-=dt;g.clock-=dt;if(g.life<=0&&!g.collapsed){g.collapsed=true;sfx('gravityCollapse',.65)}
  for(const e of S.enemy){if(e.hp<=0||e.elite)continue;const dx=g.x-e.x,dy=g.y-e.y,d=Math.hypot(dx,dy);if(d<g.r&&d>8){const force=g.force*(.45+.55*(1-d/g.r));e.x+=dx/d*force*dt;e.y+=dy/d*force*dt;e.slow=Math.max(e.slow,.12);}}
  if(g.clock<=0){g.clock=.27;for(const e of S.enemy){if(e.hp>0&&Math.hypot(e.x-g.x,e.y-g.y)<e.r+g.r)hurtEnemy(e,g.damage,{slow:.22})}}
 }S.gravityWells=S.gravityWells.filter(g=>g.life>0);
}
