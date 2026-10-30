function closest(x,y,max=360,except=null){let best=null,bestD=max*max;for(let e of S.enemy){if(e.hp<=0||e===except)continue;let d=(e.x-x)**2+(e.y-y)**2;if(d<bestD){best=e;bestD=d}}return best}
// Ranged weapons favor a reachable boss, but switch to immediate threats when surrounded.
// The nearest target still governs flame, saws, mines and short-range defensive effects.
function chooseCombatTarget(x,y,max=550,weapon='pulse'){
 const nearest=closest(x,y,max);
 if(!nearest||trainingMode||weapon==='flame')return nearest;
 let boss=null,best=Infinity;
 for(const e of S.bosses){if(e.hp<=0)continue;const dist=(e.x-x)**2+(e.y-y)**2;if(dist<best&&dist<Math.min(max,550)**2){boss=e;best=dist;}}
 if(!boss)return nearest;
 const dangerRadius=112; // collision protection takes precedence over boss focus
 if(!nearest.elite&&(nearest.x-x)**2+(nearest.y-y)**2<dangerRadius*dangerRadius)return nearest;
 return boss;
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
function fusionLine(pos,target,width,damage,length,opts={}){
 const a=aimGeometry(pos,target),origin=weaponMuzzle(pos,target,0,25),end={x:origin.x+a.dx*length,y:origin.y+a.dy*length};
 let hits=[];
 for(const e of S.enemy)if(e.hp>0&&pointSegmentDist(e.x,e.y,origin.x,origin.y,end.x,end.y)<e.r+width/2){hurtEnemy(e,damage,opts);hits.push(e)}
 S.fx.push({type:'rail',a:origin,b:end,life:.38,max:.38,col:opts.color||'#bde8ff',width});
 return {origin,end,hits,a};
}
function fusionField(x,y,r,damage,life,col,opts={}){
 if(S.effects.length>64)S.effects.shift();
 S.effects.push({x,y,r,life,clock:0,damage,col,fire:!!opts.fire});
 S.fx.push({type:'ring',x,y,r,life:.48,max:.48,col});
}
function fusionRocket(pos,target,dmg,col,variant,blast,n=1){
 for(let k=0;k<Math.min(7,n);k++){
  const angle=k*TAU/Math.max(1,n)+S.t;
  S.bullets.push({type:'rocket',x:pos.x+Math.cos(angle)*15,y:pos.y+Math.sin(angle)*15,vx:Math.cos(angle)*75,vy:Math.sin(angle)*75,target,spd:360,life:3.6,r:7,dmg,col,blast,hybrid:variant});
 }
}
function fusionBoomer(pos,target,d,damage,col,n,variant){
 const a=aimGeometry(pos,target);
 for(let k=0;k<Math.min(6,n);k++){
  const angle=Math.atan2(a.dy,a.dx)+(k-(n-1)/2)*.15,source=weaponMuzzle(pos,target,(k-(n-1)/2)*8,20);
  S.bullets.push({type:'boomer',x:source.x,y:source.y,vx:Math.cos(angle)*505,vy:Math.sin(angle)*505,spd:505,travel:0,range:Math.min(800,260+wm(d,'range')*35),returning:false,owner:d,damage,life:3.7,col,r:15,hitIds:new Set(),pierce:999,fireDisc:variant==='fire',trailClock:0,specialDisc:variant});
 }
}
function fusionMine(x,y,damage,col,r,variant){
 S.mines.push({x,y,r:13,blast:r,damage,life:17,arm:.35,col,gravityMine:false,specialMine:variant});
 if(S.mines.length>48)S.mines.splice(0,S.mines.length-48);
}
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

function droneUpdate(dt){
 const haste=S.haste||1;
 for(let i=0;i<S.drones.length;i++){
  const d=S.drones[i],meta=DRONES[d.id],rank=d.lvl;
  const pos=getDronePos(d,i),linked=S.hybrids.some(h=>HYBRIDS[h.id].a===d.id||HYBRIDS[h.id].b===d.id);
  const fusionDamage=1,fusionRate=1;
  d.cd-=dt;d.hitCd-=dt;d.flash=Math.max(0,(d.flash||0)-dt);
  const baseDmg=S.playerDmg*(1+Math.sqrt(rank-1)*.14)*(1+wm(d,'power')*.20)*(S.rageTimer>0?2.1:1);
  if(['saw','fusion_thermal','fusion_tesla','fusion_frostblade','fusion_magnetblade'].includes(d.id)){
   const positions=sawPositions(d,i),thermal=d.id==='fusion_thermal',tesla=d.id==='fusion_tesla',frost=d.id==='fusion_frostblade',magnet=d.id==='fusion_magnetblade';
   if(tesla){d.zapCd=(d.zapCd||0)-dt;if(d.zapCd<=0){const near=closest(S.player.x,S.player.y,365);if(near){scheduleChain(pos,near,3+Math.min(12,wm(d,'jumps')),22*baseDmg,260,'#ffe5a6',.22);d.zapCd=.95/(S.haste||1)}}}
   if(magnet){for(const pp of positions)for(const e of S.enemy){if(e.hp<=0||e.elite)continue;const dx=pp.x-e.x,dy=pp.y-e.y,dd=Math.hypot(dx,dy);if(dd>30&&dd<130+wm(d,'radius')*8){let pull=(90+wm(d,'force')*28)*dt;e.x+=dx/dd*pull;e.y+=dy/dd*pull;}}}
   const speedBoost=1+Math.log1p(wm(d,'spin'))*.25,overflow=1+Math.max(0,wm(d,'count')-9)*.14+Math.max(0,wm(d,'radius')-13)*.08;
   if(d.hitCd<=0){let found=0;
    for(const pp of positions){for(const e of S.enemy){
      if(e.hp>0&&Math.hypot(e.x-pp.x,e.y-pp.y)<e.r+(26+Math.min(12,Math.sqrt(rank)*2))){
       hurtEnemy(e,(16+Math.sqrt(rank)*4)*baseDmg*speedBoost*overflow,{knock:rank>=7?8:4,burn:thermal?1.3:0,stun:tesla?.08:frost?.35:0,slow:frost?2:0});if(frost)e.frost=Math.max(e.frost||0,1.8);found++;
      }
    }}
    if(tesla&&found){const near=closest(pos.x,pos.y,280);if(near)scheduleChain(pos,near,2+Math.min(8,wm(d,'jumps')),22*baseDmg,235,'#ffe9a1',.20)}
    if(found){sfx('sawHit',.8);d.hitCd=Math.max(.13,(.36-Math.min(rank,12)*.007)/(speedBoost*(S.haste||1)));if(Math.random()<.15)burst(pos.x,pos.y,thermal?'#ff8a45':AMBER,3,65);}
   }
   // THERMOPILA is a *new persistent trail weapon*, not merely a colored ring.
   if(thermal){d.trailTimer=(d.trailTimer||0)-dt;if(d.trailTimer<=0){d.trailTimer=.48;for(const pp of positions){
    if(S.effects.filter(e=>e.thermalTrail).length<25)S.effects.push({x:pp.x,y:pp.y,r:19+Math.min(rank,12)*.7,life:1.8,clock:0,damage:17*baseDmg,col:'#ff8d43',fire:true,thermalTrail:true});
    if(Math.random()<.13)burst(pp.x,pp.y,'#ff9d42',2,60);
   }}}
   continue;
  }
  let target=chooseCombatTarget(pos.x,pos.y,d.id==='flame'?205+24*Math.sqrt(wm(d,'range'))+100:550,d.id);
  // Flamethrowers are range-gated before animation, projectiles, cooldown, or sound.
  // Nearest enemy may be outside the muzzle's effective flame envelope.
  if(d.id==='flame'&&target){
   const muzzle=weaponMuzzle(pos,target,0,20),reach=205+24*Math.sqrt(wm(d,'range'));
   if(Math.hypot(target.x-muzzle.x,target.y-muzzle.y)>reach+target.r)target=null;
  }
  if(!target){d.railCharging=false;continue;}
   if(d.id==='rail'||d.id==='fusion_glacier'){
     // Start charge only with a valid target, then fire when countdown reaches zero.
     if(!d.railCharging&&d.cd<=0){
       const speed=haste*(1+Math.log1p(wm(d,'rate'))*.40)*(1+Math.log1p(rank-1)*.16);
       d.chargeDuration=Math.max(.11,Math.min(.72,.72/Math.sqrt(speed)));
       d.cd=d.chargeDuration;d.railCharging=true;
       sfx('railCharge',.70,false,Math.min(1.65,Math.max(.8,(audioBuffers.railCharge?.duration||.7)/d.chargeDuration)));
       continue;
     }
     if(d.cd>0)continue;
     d.railCharging=false;
   }else if(d.cd>0)continue;
   // Hold the exact fired-at direction until the visible beam fades.
  d.aimX=target.x;d.aimY=target.y;d.aimUntil=S.t+.23;
  d.flash=.18;
  sfxWeapon(d.id);
  const cooldownBonus=1+Math.log1p(wm(d,'rate'))*.40;
  // Even at extreme ranks the cooldown remains playable; extra investments add damage.
  const rawCooldown=meta.base/(haste*fusionRate*cooldownBonus*(1+Math.log1p(rank-1)*.16));
  const attackOverflow=Math.max(1,.19/Math.max(.0001,rawCooldown));
  d.cd=Math.max(.19,rawCooldown);
  if(d.id==='fusion_ion'){
   const n=Math.min(5,1+wm(d,'beams'));
   for(let j=0;j<n;j++){
    const off=(j-(n-1)/2)*16,source=weaponMuzzle(pos,target,off,30);
    launchBullet(source.x,source.y,target,26*baseDmg,'fusion_ion',2+Math.floor(rank/8));
    S.fx.push({type:'beam',a:source,b:{x:target.x,y:target.y},life:.28,max:.28,col:'#cc9bff',width:3.4});
   }
   scheduleChain(weaponMuzzle(pos,target,0,30),target,5+Math.min(10,wm(d,'jumps')),27*baseDmg,250,'#d5afff',.18);burst(target.x,target.y,'#b6dfff',16,135);continue;
  }
  if(d.id==='fusion_starfall'||d.id==='fusion_predator'){
   const star=d.id==='fusion_starfall',n=Math.min(8,3+wm(d,'salvo'));
   if(!star){S.fx.push({type:'beam',a:weaponMuzzle(pos,target,0,30),b:{x:target.x,y:target.y},life:.28,max:.28,col:RED,width:4});target.marked=4;}
   for(let j=0;j<n;j++){const angle=j*TAU/n+S.t;
    S.bullets.push({type:'rocket',x:pos.x+Math.cos(angle)*14,y:pos.y+Math.sin(angle)*14,vx:Math.cos(angle)*90,vy:Math.sin(angle)*90,target,spd:390,life:4,r:7,dmg:(star?39:47)*baseDmg,col:star?BLUE:RED,blast:Math.min(175,74+wm(d,'blast')*19),hybrid:star?'starfall':'predator'});
   }continue;
  }
  // v0.7: each recipe below is a real alternative combat mechanism, not just a renamed drone.
  if(d.id.startsWith('fusion_') && fireFusionSpecial(d,pos,target,baseDmg,rank))continue;
  if(d.id==='pulse'){
   const total=Math.min(7,1+wm(d,'beams')+(rank>=8?1:0)),pierce=wm(d,'pierce')+(rank>=8?1:0);
   for(let j=0;j<total;j++){
    const offset=(j-(total-1)/2)*13,source=weaponMuzzle(pos,target,offset,24);
    launchBullet(source.x,source.y,target,(17+Math.sqrt(rank)*8)*baseDmg*(1+.14*Math.max(0,wm(d,'beams')-6))/(1+.18*(total-1)),'pulse',pierce);
    S.fx.push({type:'beam',a:source,b:{x:target.x,y:target.y},life:.18,max:.18,col:TEAL,width:rank>=8?3.3:1.8});
   }
  }
  if(d.id==='arc'){
   scheduleChain(weaponMuzzle(pos,target,0,24),target,2+Math.min(20,wm(d,'jumps')),(16+Math.sqrt(rank)*5)*baseDmg*attackOverflow*(1+.07*Math.max(0,wm(d,'jumps')-20))/2.2,205+28*Math.sqrt(wm(d,'range')),PURPLE,.09);
   if(rank>=8){const next=closest(target.x+32,target.y+32,260,target);if(next)scheduleChain(weaponMuzzle(pos,next,0,24),next,2+Math.min(20,wm(d,'jumps')),14*baseDmg*attackOverflow*(1+.07*Math.max(0,wm(d,'jumps')-20)),215+28*Math.sqrt(wm(d,'range')),'#d9c1ff',.12);}
  }
  if(d.id==='rail'||d.id==='fusion_glacier'){
   // Railgun: hits every enemy crossing a long, thick laser corridor. Charging flash is visible before the shot.
   const isIce=d.id==='fusion_glacier',a=aimGeometry(pos,target),origin=weaponMuzzle(pos,target,0,27),length=Math.min(1500,640+55*Math.sqrt(wm(d,'pierce'))),width=(isIce?17:11)+6*Math.sqrt(wm(d,'width'));
   const end={x:origin.x+a.dx*length,y:origin.y+a.dy*length};
   let hits=0;
   for(const e of S.enemy){if(e.hp>0&&pointSegmentDist(e.x,e.y,origin.x,origin.y,end.x,end.y)<e.r+width/2){hurtEnemy(e,((isIce?84:100)*baseDmg+rank*7)*attackOverflow,{knock:isIce?8:20,stun:isIce?.9+wm(d,'freeze')*.13:.07,slow:isIce?2.2:0});hits++;}}
   S.fx.push({type:'rail',a:origin,b:end,life:.44,max:.44,col:isIce?'#a6edff':'#ffd886',width});
   burst(origin.x,origin.y,isIce?'#b6f4ff':'#ffecb9',21,120);if(hits)shake=Math.max(shake,4);continue;
  }
  if(d.id==='cryo'){
   const a=aimGeometry(pos,target),length=230+22*Math.sqrt(wm(d,'range')),half=Math.PI/6; // Fixed 60-degree cone
   const origin=weaponMuzzle(pos,target,0,15),chillPower=20*(1+Math.log1p(wm(d,'chill'))*.56);
   for(const e of S.enemy){if(e.hp<=0)continue;
    const dx=e.x-origin.x,dy=e.y-origin.y,rr=Math.hypot(dx,dy);if(rr>length+e.r)continue;
    if(Math.atan2(Math.abs(a.dx*dy-a.dy*dx),a.dx*dx+a.dy*dy)<half){
     const extra=e.chill>0?Math.log1p(wm(d,'chill'))*.22:0;
     hurtEnemy(e,(14+Math.sqrt(rank)*6)*baseDmg*attackOverflow*(1+extra),{slow:.7});
     applyChill(e,chillPower);
    }
   }
   S.fx.push({type:'cryo',x:origin.x,y:origin.y,ang:Math.atan2(a.dy,a.dx),length,half,life:.44,max:.44,seed:rand(0,500)});
   burst(origin.x+a.dx*Math.min(length*.65,180),origin.y+a.dy*Math.min(length*.65,180),'#b1f7ff',8,82);continue;
  }
  if(d.id==='mine'||d.id==='fusion_singularity'){
   const gravityMine=d.id==='fusion_singularity',n=Math.min(4,(gravityMine?2:1)+wm(d,'count'));
   // Mines accumulate strategically but there is a hard cap for mobile performance.
   for(let j=0;j<n;j++){const angle=S.t*1.7+j*TAU/n,offset=j===0?0:48+Math.min(j*22,64);
    S.mines.push({x:S.player.x+Math.cos(angle)*offset,y:S.player.y+Math.sin(angle)*offset,r:12,blast:Math.min(200,(gravityMine?86:67)+wm(d,'blast')*17),damage:(gravityMine?80:54)*baseDmg*(1+.12*Math.max(0,wm(d,'count')-3)),life:gravityMine?18:15,arm:.45,col:gravityMine?'#c5a6ff':'#ffc36c',gravityMine,gravRadius:Math.min(280,155+wm(d,'blast')*15),force:Math.min(390,155*Math.pow(1.22,wm(d,'force')))});
   }
   if(S.mines.length>48)S.mines.splice(0,S.mines.length-48);
   burst(pos.x,pos.y,'#ffc36c',6,70);continue;
  }
  if(d.id==='boomer'||d.id==='fusion_inferno'){
   const fireDisc=d.id==='fusion_inferno',n=Math.min(5,(fireDisc?2:1)+wm(d,'count')),a=aimGeometry(pos,target),range=Math.min(820,260+wm(d,'range')*35);
   for(let j=0;j<n;j++){const offset=(j-(n-1)/2)*.16,ang=Math.atan2(a.dy,a.dx)+offset,source=weaponMuzzle(pos,target,(j-(n-1)/2)*9,21);
    S.bullets.push({type:'boomer',x:source.x,y:source.y,vx:Math.cos(ang)*510,vy:Math.sin(ang)*510,spd:510,travel:0,range,returning:false,owner:d,damage:(fireDisc?44:32)*baseDmg*(1+.12*Math.max(0,wm(d,'count')-4)+.03*Math.max(0,wm(d,'range')-16))/(1+.12*(n-1)),life:3.5,col:fireDisc?'#ff9c5b':'#8affb2',r:13,hitIds:new Set(),pierce:999,fireDisc,trailClock:0});
   }continue;
  }
  if(d.id==='gravity'){
   // A physical projectile leaves the turret before opening a gravity well at its destination.
   const a=aimGeometry(pos,target),origin=weaponMuzzle(pos,target,0,20);
   const radius=90+20*Math.sqrt(wm(d,'radius'));
   S.bullets.push({type:'gravitySeed',x:origin.x,y:origin.y,vx:a.dx*430,vy:a.dy*430,
    tx:target.x,ty:target.y,life:2.0,r:8,owner:d,spd:430,col:'#be9cff',
    wellRadius:radius,force:115*(1+.22*Math.log1p(wm(d,'force'))),
    wellDamage:(12+Math.sqrt(rank)*4)*baseDmg*attackOverflow,wellLife:2.8+.5*Math.sqrt(wm(d,'duration'))});
   continue;
  }
  if(d.id==='flame'){
   const a=aimGeometry(pos,target),origin=weaponMuzzle(pos,target,0,20),length=205+24*Math.sqrt(wm(d,'range')),half=Math.PI/9; // 40-degree stream
   const igniteDps=7*S.playerDmg*(1+.25*wm(d,'ignite'));
   for(const e of S.enemy){if(e.hp<=0)continue;
    const dx=e.x-origin.x,dy=e.y-origin.y,rr=Math.hypot(dx,dy);if(rr>length+e.r)continue;
    if(Math.atan2(Math.abs(a.dx*dy-a.dy*dx),a.dx*dx+a.dy*dy)<half)
     hurtEnemy(e,(8+Math.sqrt(rank)*3.7)*baseDmg*attackOverflow,{burn:4,burnPower:igniteDps});
   }
   S.fx.push({type:'flame',x:origin.x,y:origin.y,ang:Math.atan2(a.dy,a.dx),length,half,life:.35,max:.35,seed:rand(0,500)});
   burst(origin.x+a.dx*Math.min(length*.6,170),origin.y+a.dy*Math.min(length*.6,170),'#ffb04e',7,75);continue;
  }
  if(d.id==='rocket'){
   const count=Math.min(9,1+wm(d,'salvo')+(rank>=8?1:0));
   for(let j=0;j<count;j++){
    const angle=j*TAU/count+S.t,offset=(j-(count-1)/2)*10;
    S.bullets.push({type:'rocket',x:pos.x+offset,y:pos.y+offset*.3,vx:Math.cos(angle)*60,vy:Math.sin(angle)*60,target,spd:315+rank*10,life:3.3,r:6,dmg:(27+Math.sqrt(rank)*12)*baseDmg*(1+.13*Math.max(0,wm(d,'salvo')-8))/(1+.19*(count-1)),col:RED,blast:54+22*Math.sqrt(wm(d,'blast'))});
   }
  }
  if(d.id==='plasma'){
   const radius=Math.min(240,61+Math.min(11,rank)*6+Math.min(9,wm(d,'radius'))*21);
   const duration=Math.min(9,2.1+Math.sqrt(rank)*.25+Math.min(14,wm(d,'duration'))*.65);
   S.effects.push({x:target.x,y:target.y,r:radius,life:duration,clock:0,damage:(9+Math.sqrt(rank)*4)*baseDmg*(1+.07*Math.max(0,wm(d,'radius')-9)+.06*Math.max(0,wm(d,'duration')-14))/1.8,col:BLUE});
   if(rank>=8)damageArea(target.x,target.y,radius*.48,14*baseDmg,{color:BLUE,slow:.45});
   burst(target.x,target.y,BLUE,7,95);
  }
 }
}
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
