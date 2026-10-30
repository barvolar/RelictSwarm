function updateProjectiles(dt){for(let b of S.bullets){b.life-=dt;
 if(b.type==='gravitySeed'){
  const dx=b.tx-b.x,dy=b.ty-b.y,dist=Math.hypot(dx,dy);
  if(dist<=b.spd*dt+11||b.life<=0){
   sfx('gravity',.32);S.gravityWells.push({x:b.tx,y:b.ty,r:b.wellRadius,force:b.force,damage:b.wellDamage,
    life:b.wellLife,clock:.05,col:b.col});
   if(S.gravityWells.length>12)S.gravityWells.shift();
   burst(b.tx,b.ty,'#bca2ff',15,90);S.fx.push({type:'ring',x:b.tx,y:b.ty,r:30,life:.40,max:.40,col:'#c0a1ff'});b.life=-1;
  }else{b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(Math.random()<dt*22)S.parts.push({x:b.x,y:b.y,vx:-b.vx*.12+rand(-20,20),vy:-b.vy*.12+rand(-20,20),life:.25,max:.25,size:3,col:'#bba1ff'});
  }
 }else if(b.type==='boomer'){
   b.travel+=b.spd*dt;const ownerPos=getDronePos(b.owner,Math.max(0,S.drones.indexOf(b.owner)));
   if(!b.returning&&b.travel>=b.range){b.returning=true;b.hitIds.clear();sfx('boomerReturn',.55)}
   if(b.specialDisc){b.trailClock-=dt;if(b.trailClock<=0){if(b.specialDisc==='mine')fusionMine(b.x,b.y,b.damage*.58,'#ffd78f',58,'normal');b.trailClock=.24;}}
   if(b.fireDisc){b.trailClock-=dt;if(b.trailClock<=0){b.trailClock=.22;if(S.effects.filter(x=>x.infernoTrail).length<35)S.effects.push({x:b.x,y:b.y,r:24,life:1.9,clock:0,damage:b.damage*.16,col:'#ff8f4f',fire:true,infernoTrail:true});}}
   if(b.returning){const vec=hypot(ownerPos.x-b.x,ownerPos.y-b.y);b.vx=(ownerPos.x-b.x)/vec*b.spd*1.35;b.vy=(ownerPos.y-b.y)/vec*b.spd*1.35;if(vec<25)b.life=-1;}
   b.x+=b.vx*dt;b.y+=b.vy*dt;for(const e of S.enemy){if(e.hp<=0||b.hitIds.has(e))continue;if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){hurtEnemy(e,b.damage,{knock:7,burn:b.fireDisc?2.2:0});b.hitIds.add(e);if(b.specialDisc==='lightning')scheduleChain({x:b.x,y:b.y},e,3+Math.min(10,wm(b.owner,'jumps')),b.damage*.42,180,'#c3baff',.17);burst(e.x,e.y,b.col,4,60)}}
  }else if(b.type==='rocket'){if(!b.target||b.target.hp<=0)b.target=closest(b.x,b.y,420);if(b.target){let m=hypot(b.target.x-b.x,b.target.y-b.y),tx=(b.target.x-b.x)/m*b.spd,ty=(b.target.y-b.y)/m*b.spd;b.vx=lerp(b.vx,tx,Math.min(1,dt*5));b.vy=lerp(b.vy,ty,Math.min(1,dt*5))}b.x+=b.vx*dt;b.y+=b.vy*dt;const e=closest(b.x,b.y,19);if(e||b.life<=0){sfx('explosion',b.hybrid==='napalm'?1.1:.74);damageArea(b.x,b.y,b.blast,b.dmg,{color:b.hybrid==='starfall'?BLUE:b.hybrid==='napalm'?'#ff904f':RED,slow:b.hybrid==='starfall'?.8:0,knock:11,burn:b.hybrid==='napalm'?2.8:0});if(b.hybrid==='napalm')fusionField(b.x,b.y,b.blast*.95,b.dmg*.19,3,'#ff8742',{fire:true});if(b.hybrid==='starfall'){S.effects.push({x:b.x,y:b.y,r:73,life:1.65,clock:0,damage:b.dmg*.25,col:BLUE});burst(b.x,b.y,'#bef5ff',25,230);}b.life=-1;shake=Math.max(shake,2)}}else{b.x+=b.vx*dt;b.y+=b.vy*dt;for(let e of S.enemy){if(e.hp>0&&!(b.hitIds&&b.hitIds.has(e))&&Math.abs(e.x-b.x)<e.r+b.r&&Math.abs(e.y-b.y)<e.r+b.r&&Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){hurtEnemy(e,b.dmg,{knock:5});if((b.type==='pulse'||b.type==='fusion_ion')&&performance.now()/1000-lastLaserImpact>.085){sfx('laserHit',.70);lastLaserImpact=performance.now()/1000}if(b.hitIds)b.hitIds.add(e);burst(b.x,b.y,TEAL,3,65);if(b.pierce>0){b.pierce--;b.dmg*=.75;b.x+=b.vx*dt*3;b.y+=b.vy*dt*3}else b.life=-1;break}}}}
 S.bullets=S.bullets.filter(b=>b.life>0);
 for(let b of S.enemyBullets){b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(Math.hypot(S.player.x-b.x,S.player.y-b.y)<S.player.rad+b.r){hitPlayer(b.dmg,b.x,b.y);b.life=-1;burst(b.x,b.y,RED,6,60)}}S.enemyBullets=S.enemyBullets.filter(b=>b.life>0);
 for(let eff of S.effects){eff.life-=dt;eff.clock-=dt;if(eff.clock<=0){eff.clock=.28;for(let e of S.enemy){if(e.hp>0&&Math.hypot(e.x-eff.x,e.y-eff.y)<e.r+eff.r)hurtEnemy(e,eff.damage,{slow:.34,burn:.5})}}}S.effects=S.effects.filter(x=>x.life>0);
 updateChains(dt);for(let fx of S.fx)fx.life-=dt;S.fx=S.fx.filter(x=>x.life>0);if(S.fx.length>180)S.fx.splice(0,S.fx.length-180);
}

// V0.3: Boss mechanics are explicit and telegraphed; none shares the same generic radial shot.
