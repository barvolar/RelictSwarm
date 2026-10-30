function droneUpdate(dt){
 const haste=S.haste||1;
 for(let i=0;i<S.drones.length;i++){
  const d=S.drones[i],meta=DRONES[d.id],rank=d.lvl;
  const pos=getDronePos(d,i),linked=S.hybrids.some(h=>HYBRIDS[h.id].a===d.id||HYBRIDS[h.id].b===d.id);
  d.cd-=dt;d.hitCd-=dt;d.flash=Math.max(0,(d.flash||0)-dt);
  const baseDmg=calculateWeaponDamage(S.playerDmg,rank,wm(d,'power'),S.rageTimer>0);
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
  // Preserve the .19-second firing floor; excess attack speed becomes extra damage.
  const {cooldown,attackOverflow}=calculateWeaponCooldown(meta.base,haste,wm(d,'rate'),rank);
  d.cd=cooldown;
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
