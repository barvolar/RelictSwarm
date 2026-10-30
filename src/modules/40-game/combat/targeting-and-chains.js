function closest(x,y,max=360,except=null){let best=null,bestD=max*max;for(let e of S.enemy){if(e.hp<=0||e===except)continue;let d=(e.x-x)**2+(e.y-y)**2;if(d<bestD){best=e;bestD=d}}return best}
// Ranged weapons favor a reachable boss, but switch to immediate threats when surrounded.
// The nearest target still governs flame, saws, mines and short-range defensive effects.
function chooseCombatTarget(x,y,max=550,weapon='pulse'){
 return selectCombatTarget(closest(x,y,max),S.bosses,x,y,max,weapon,trainingMode);
}
function damageArea(x,y,r,dmg,options={}){for(const e of S.enemy){if(e.hp<=0)continue;let dx=e.x-x,dy=e.y-y;if(dx*dx+dy*dy<(r+e.r)**2){hurtEnemy(e,dmg,options)}}S.fx.push({type:'ring',x,y,r,life:.32,max:.32,col:options.color||AMBER});burst(x,y,options.color||AMBER,19,r*2)}
// Shared firing geometry. The illustrated muzzle is on the drone's local -Y axis.
// World-space weapon muzzles MUST use this same direction as the displayed drone.
function aimGeometry(pos,target){
 const dx=target.x-pos.x,dy=target.y-pos.y,len=Math.max(.0001,Math.hypot(dx,dy));
 return {dx:dx/len,dy:dy/len,rx:-dy/len,ry:dx/len};
}
function weaponMuzzle(pos,target,lateral=0,forward=24){
 const a=aimGeometry(pos,target);
 return {x:pos.x+a.dx*forward+a.rx*lateral,y:pos.y+a.dy*forward+a.ry*lateral};
}
function launchBullet(x,y,e,d,id,pierce=0){const m=hypot(e.x-x,e.y-y);S.bullets.push({x,y,vx:(e.x-x)/m*590,vy:(e.y-y)/m*590,r:4.5,life:1.2,dmg:d,col:DRONES[id]?.color||TEAL,type:id,hits:0,pierce,hitIds:new Set()})}
function scheduleChain(from,target,jumps,damage,radius=220,color=PURPLE,stun=.16){
 if(!target||S.chains.length>(touching?15:28))return;
 S.chains.push({from:{x:from.x,y:from.y},target,remaining:jumps,damage,radius,color,stun,visited:new Set(),delay:0});
}
function updateChains(dt){
 // Each jump arrives on a different frame. Never inspect an unrelated FX object for its endpoint.
 for(let i=S.chains.length-1;i>=0;i--){
  const c=S.chains[i];c.delay-=dt;
  if(c.delay>0)continue;
  let e=c.target;
  if(!e||e.hp<=0||c.visited.has(e)){
    e=null;let best=c.radius*c.radius;
    for(const z of S.enemy){if(z.hp<=0||c.visited.has(z))continue;const dd=(z.x-c.from.x)**2+(z.y-c.from.y)**2;if(dd<best){best=dd;e=z;}}
  }
  if(!e){S.chains.splice(i,1);continue;}
  const end={x:e.x,y:e.y};
  c.visited.add(e);
  S.fx.push({type:'lightning',a:{...c.from},b:end,life:.32,max:.32,col:c.color,width:3.5,seed:rand(0,1000)});
  e.shock=.19;sfx('arc',c.visited.size>1?.42:.8);hurtEnemy(e,c.damage,{stun:c.stun});
  burst(end.x,end.y,c.color,5,65);
  c.from=end;c.remaining--;c.damage*=.82;c.delay=.095;
  if(c.remaining<=0)S.chains.splice(i,1);
 }
}
function updateHybridCombat(dt){} // v0.5.1.1: hybrids are now actual replacement weapons

// Shared special-weapon physics. New recipes route through distinct patterns.
