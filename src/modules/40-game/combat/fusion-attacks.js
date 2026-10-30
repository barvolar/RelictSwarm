function fireFusionSpecial(d,pos,target,base,rank){
 const type=d.id.slice(7),col=DRONES[d.id].color,damage=base*(32+Math.sqrt(rank)*7),rate=wm(d,'rate'),radius=wm(d,'radius');
 if(type==='spear'){
  const shot=fusionLine(pos,target,15+wm(d,'pierce')*3,damage*2.9,900,{color:col,knock:16});
  for(const e of shot.hits.slice(0,5)){
   const next=closest(e.x+40,e.y+40,130,e);if(next){launchBullet(e.x,e.y,next,damage*.75,d.id,1);S.fx.push({type:'beam',a:{x:e.x,y:e.y},b:{x:next.x,y:next.y},life:.24,max:.24,col,width:2.5});}
  }return true;
 }
 if(type==='polar'){
  const shot=fusionLine(pos,target,13,damage*1.35,740,{color:col,slow:2.3,stun:.25+wm(d,'freeze')*.12});
  for(const e of shot.hits){e.frost=2.4;}for(let k=1;k<5;k++)fusionField(shot.origin.x+shot.a.dx*k*110,shot.origin.y+shot.a.dy*k*110,23,damage*.11,1.2,'#b9efff');return true;
 }
 if(type==='prism'){
  const r=Math.min(210,100+radius*16);S.gravityWells.push({x:target.x,y:target.y,r,force:160,damage:damage*.12,life:2.0,clock:.05,col});
  for(const e of S.enemy.filter(e=>e.hp>0).sort((a,b)=>(a.x-target.x)**2+(a.y-target.y)**2-(b.x-target.x)**2-(b.y-target.y)**2).slice(0,Math.min(7,3+wm(d,'beams')))){
   if(Math.hypot(e.x-target.x,e.y-target.y)<r*1.7){S.fx.push({type:'beam',a:{x:target.x,y:target.y},b:{x:e.x,y:e.y},life:.32,max:.32,col,width:3});hurtEnemy(e,damage*.9,{slow:.3});}
  }burst(target.x,target.y,col,13,100);return true;
 }
 if(type==='siege'){
  const shot=fusionLine(pos,target,18,damage*2.0,750,{color:col,knock:18});damageArea(target.x,target.y,85+wm(d,'blast')*13,damage*1.15,{color:col,knock:14});
  S.fx.push({type:'ring',x:target.x,y:target.y,r:85,life:.5,max:.5,col});return true;
 }
 if(type==='thunder'){
  const shot=fusionLine(pos,target,11,damage*1.6,780,{color:col,stun:.2});
  for(const e of shot.hits.slice(0,4))scheduleChain({x:e.x,y:e.y},closest(e.x+25,e.y+25,220,e),3+Math.min(8,wm(d,'jumps')),damage*.5,225,'#d7c4ff',.22);return true;
 }
 if(type==='overload'){
  fusionField(target.x,target.y,88+radius*15,damage*.2,2.5,'#ab87ff');
  scheduleChain(pos,target,4+wm(d,'jumps'),damage*.8,240,'#d6b5ff',.3);return true;
 }
 if(type==='frostwell'){
  const r=Math.min(255,125+radius*18);S.gravityWells.push({x:target.x,y:target.y,r,force:170,damage:damage*.16,life:3,clock:.04,col});
  damageArea(target.x,target.y,r,damage*.7,{color:col,slow:2.5,stun:.4+wm(d,'freeze')*.13});for(const e of S.enemy)if(e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<r)e.frost=2.5;return true;
 }
 if(type==='thermoshock'){
  const a=aimGeometry(pos,target),length=Math.min(500,205+wm(d,'range')*25),half=(39+wm(d,'angle')*8)*Math.PI/360;
  const hot=(d.shockCycle=(d.shockCycle||0)+1)%2===0;
  for(const e of S.enemy){if(e.hp<=0)continue;const dx=e.x-pos.x,dy=e.y-pos.y,r=Math.hypot(dx,dy);if(r>length+e.r||Math.atan2(Math.abs(a.dx*dy-a.dy*dx),a.dx*dx+a.dy*dy)>half)continue;
   if((hot&&e.frost>0)||(!hot&&e.burn>0))damageArea(e.x,e.y,45,damage*1.2,{color:col});
   hurtEnemy(e,damage*.56,hot?{burn:3}:{stun:.23,slow:2});if(!hot)e.frost=2.2;
  }
  S.fx.push({type:hot?'flame':'cryo',x:pos.x,y:pos.y,ang:Math.atan2(a.dy,a.dx),length,half,life:.38,max:.38});return true;
 }
 if(type==='napalm'){
  fusionRocket(pos,target,damage*1.2,col,'napalm',68+wm(d,'blast')*14,2+wm(d,'salvo'));return true;
 }
 if(type==='arcdisc'){
  fusionBoomer(pos,target,d,damage*.8,col,2+wm(d,'count'),'lightning');return true;
 }
 if(type==='trapdisc'){
  fusionBoomer(pos,target,d,damage*.85,col,2+wm(d,'count'),'mine');return true;
 }
 if(type==='sunheart'){
  const r=Math.min(260,130+radius*18);S.gravityWells.push({x:target.x,y:target.y,r,force:175+wm(d,'force')*24,damage:damage*.15,life:3,clock:.04,col});fusionField(target.x,target.y,r*.7,damage*.22,2.6,'#ff9450',{fire:true});return true;
 }
 if(type==='frostmine'){
  for(let k=0;k<Math.min(6,2+wm(d,'count'));k++){const a=S.t*1.7+k*TAU/Math.max(2,2+wm(d,'count'));fusionMine(S.player.x+Math.cos(a)*60,S.player.y+Math.sin(a)*60,damage,col,86+wm(d,'blast')*13,'ice');}return true;
 }
 if(type==='plasmamelt'){
  const a=aimGeometry(pos,target),length=Math.min(460,205+wm(d,'range')*23),half=(33+wm(d,'angle')*8)*Math.PI/360;
  for(const e of S.enemy){if(e.hp<=0)continue;const dx=e.x-pos.x,dy=e.y-pos.y,rr=Math.hypot(dx,dy);if(rr<length+e.r&&Math.atan2(Math.abs(a.dx*dy-a.dy*dx),a.dx*dx+a.dy*dy)<half){hurtEnemy(e,damage*.76,{burn:4});}}
  fusionField(target.x,target.y,75,damage*.22,2.3,'#ff99bb',{fire:true});S.fx.push({type:'flame',x:pos.x,y:pos.y,ang:Math.atan2(a.dy,a.dx),length,half,life:.39,max:.39});return true;
 }
 if(type==='railplasma'){
  const shot=fusionLine(pos,target,16+wm(d,'width')*4,damage*1.65,820,{color:col,knock:7});
  for(const e of shot.hits.slice(0,7))fusionField(e.x,e.y,50,damage*.2,2.3,col);return true;
 }
 return false;
}

