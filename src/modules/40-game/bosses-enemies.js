function bossAttack(e,dt,dx,dy,d){
 if(!e.elite)return;
 e.special-=dt;
 if(e.special>0)return;
 const p=S.player;let ang=Math.atan2(dy,dx),phase=e.phase?1:0;
 if(e.id==='boss1'){
  // Reaper: a clearly signalled long blade dash. Dash pierces enemies but damages player only on final impact.
  S.hazards.push({type:'slash',x:e.x,y:e.y,ang,len:clamp(d+80,180,580),r:35+phase*12,delay:1.1,life:1.1,col:'#ff825a',dmg:24+phase*8});
  e.special=phase?3.0:4.1;banner('ЖНЕЦ: ЛИНИЯ РАЗРЕЗА — УКЛОНИСЬ!',1.4);
 }else if(e.id==='boss2'){
  // Archon: locks onto player with several delayed electric circles, summons ranged sentries.
  const n=phase?4:3;
  for(let k=0;k<n;k++){const a=k*TAU/n+S.t*.21;
   S.hazards.push({type:'circle',x:p.x+Math.cos(a)*rand(55,115),y:p.y+Math.sin(a)*rand(55,115),r:74+phase*12,delay:1.3+k*.12,life:1.3+k*.12,col:'#b995ff',dmg:22+phase*6});
  }
  for(let k=0;k<(phase?5:3);k++){const a=k*TAU/(phase?5:3)+rand(-.3,.3);spawnEnemyNear('sentry',e.x+Math.cos(a)*90,e.y+Math.sin(a)*90)}
  e.special=phase?5.0:7.0;banner('АРХОНТ: ЛОВУШКИ + ПОДКРЕПЛЕНИЕ!',1.6);
 }else if(e.id==='synth1'){
  // Forged guardian: closing concentric prison plus predictive cross strikes.
  for(let k=0;k<(phase?4:3);k++){
   const an=ang+(k-(phase?1.5:1))*.75;
   S.hazards.push({type:'slash',x:e.x,y:e.y,ang:an,len:560,r:35+phase*10,delay:1.25+k*.12,life:1.25+k*.12,col:'#ffd477',dmg:34+phase*14});
  }
  S.hazards.push({type:'circle',x:p.x,y:p.y,r:90+phase*18,delay:1.4,life:1.4,col:'#ff9849',dmg:33+phase*12});
  e.special=phase?3.5:4.8;banner('⚠ ХРАНИТЕЛЬ: ПЕРЕКРЁСТНЫЕ РАЗРЕЗЫ!',2.1);
 }else if(e.id==='synth2'){
  // Chaos smith: expanding bullet-cage and staggered meteor fields.
  for(let j=0;j<(phase?22:15);j++){const a=j*TAU/(phase?22:15)+S.t*.42;
   S.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*255,vy:Math.sin(a)*255,r:8,dmg:22+phase*8,col:'#8ef6ff',life:4});
  }
  for(let k=0;k<(phase?6:4);k++){const a=k*TAU/(phase?6:4)+S.t*.5;
   S.hazards.push({type:'circle',x:p.x+Math.cos(a)*rand(55,170),y:p.y+Math.sin(a)*rand(55,170),r:80,delay:1.1+k*.17,life:1.1+k*.17,col:'#64f9ec',dmg:35+phase*10});
  }
  if(phase)for(let j=0;j<4;j++)spawnEnemyNear('phantom',e.x,e.y);
  e.special=phase?3.8:5.0;banner('⚠ КУЗНЕЦ ХАОСА: ШТОРМ + МЕТЕОРЫ!',2.1);
 }else if(e.id==='boss3'){
   // Punisher: alternating cross-lines and predicted circular traps.
   for(let k=0;k<(phase?5:3);k++){
    const a=ang+(k-(phase?2:1))*.37;
    S.hazards.push({type:'slash',x:e.x,y:e.y,ang:a,len:600,r:24+phase*7,delay:1.0+k*.15,life:1.0+k*.15,col:'#ff7e9b',dmg:28+phase*7});
   }
   for(let k=0;k<(phase?4:2);k++){
    const a=k*TAU/(phase?4:2)+S.t*.17;
    S.hazards.push({type:'circle',x:p.x+Math.cos(a)*rand(60,140),y:p.y+Math.sin(a)*rand(60,140),r:76,delay:1.3+k*.12,life:1.3+k*.12,col:'#ff9c74',dmg:26+phase*8});
   }
   e.special=phase?3.8:5.3;banner('КАРАТЕЛЬ: СЕТЬ РАЗРЕЗОВ!',1.5);
  }else if(e.id==='synth3'){
   // Third synthesis boss: pressure field + fan of moving projectiles, second-phase support.
   for(let k=0;k<(phase?9:6);k++){
    const a=ang+(k-((phase?9:6)-1)/2)*.17;
    S.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(255+phase*30),vy:Math.sin(a)*(255+phase*30),r:7,dmg:23+phase*8,col:'#fa9acf',life:4.7});
   }
   S.hazards.push({type:'circle',x:p.x,y:p.y,r:105+phase*20,delay:1.25,life:1.25,col:'#ffaec7',dmg:37+phase*9});
   if(phase)for(let k=0;k<3;k++)spawnEnemyNear('phantom',e.x,e.y);
   e.special=phase?3.6:5.0;banner('СБОЙ РЕАКТОРА: ОТХОДИ ИЗ ЗОНЫ!',1.5);
 }else if(e.id==='omega'){
  // Omega: rotating aimed bullet fans + rings of expanding ground explosions.
  const count=phase?16:12;
  for(let j=0;j<count;j++){const a=ang+j*TAU/count+S.t*.3;
   S.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(230+phase*35),vy:Math.sin(a)*(230+phase*35),r:7,dmg:12+phase*3,col:'#ffca74',life:4.8});
  }
  for(let k=0;k<(phase?6:4);k++){let a=k*TAU/(phase?6:4)+S.t*.12;
   S.hazards.push({type:'circle',x:e.x+Math.cos(a)*200,y:e.y+Math.sin(a)*200,r:90,delay:1.3+k*.14,life:1.3+k*.14,col:'#ffac56',dmg:23+phase*7});
  }
  if(phase)for(let k=0;k<3;k++)spawnEnemyNear('hunter',e.x,e.y);
  e.special=phase?3.9:5.2;banner('ОМЕГА: ПЕРЕГРУЗКА СЕКТОРОВ!',1.5);
 }
}
function pointSegmentDist(px,py,x0,y0,x1,y1){let dx=x1-x0,dy=y1-y0,t=clamp(((px-x0)*dx+(py-y0)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-(x0+dx*t),py-(y0+dy*t))}
function updateHazards(dt){
 for(const h of S.hazards){h.delay-=dt;h.life-=dt;
  if(h.delay>0||h.hit)continue;
  h.hit=true;
  if(h.type==='slash'){
   let x1=h.x+Math.cos(h.ang)*h.len,y1=h.y+Math.sin(h.ang)*h.len;
   if(pointSegmentDist(S.player.x,S.player.y,h.x,h.y,x1,y1)<h.r+S.player.rad)hitPlayer(h.dmg,h.x,h.y);
   S.fx.push({type:'beam',a:{x:h.x,y:h.y},b:{x:x1,y:y1},life:.25,max:.25,col:h.col,width:12});
   shake=Math.max(8,shake);
  }else{
   if(Math.hypot(S.player.x-h.x,S.player.y-h.y)<h.r+S.player.rad)hitPlayer(h.dmg,h.x,h.y);
   S.fx.push({type:'ring',x:h.x,y:h.y,r:h.r,life:.4,max:.4,col:h.col});
   burst(h.x,h.y,h.col,16,160);
  }
 }
 S.hazards=S.hazards.filter(h=>h.life>-.3);
}
function drawHazards(){
 for(const h of S.hazards){
  if(h.hit)continue;const k=clamp(1-h.delay/1.5,0,1);
  cx.save();cx.globalAlpha=.3+.4*k;
  if(h.type==='slash'){
   let x1=h.x+Math.cos(h.ang)*h.len,y1=h.y+Math.sin(h.ang)*h.len;
   cx.strokeStyle=h.col;cx.lineWidth=h.r*2;cx.lineCap='round';cx.setLineDash([12,12]);
   cx.beginPath();cx.moveTo(h.x,h.y);cx.lineTo(x1,y1);cx.stroke();cx.setLineDash([]);
   line(h.x,h.y,x1,y1,'#ffe0c0',3);
  }else{
   cx.fillStyle=h.col+'32';cx.strokeStyle=h.col;cx.lineWidth=3+k*2;
   cx.beginPath();cx.arc(h.x,h.y,h.r,0,TAU);cx.fill();cx.stroke();
   cx.beginPath();cx.arc(h.x,h.y,h.r*(1-k),0,TAU);cx.stroke();
  }
  cx.restore();
 }
}

function updateEnemies(dt){let p=S.player,grid=new Map(),cell=50;for(const e of S.enemy){if(e.hp<=0)continue;let gx=Math.floor(e.x/cell),gy=Math.floor(e.y/cell),key=gx+','+gy;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(e)}
 for(const e of S.enemy){if(e.hp<=0)continue;e.t+=dt;e.hit=Math.max(0,e.hit-dt);e.shock=Math.max(0,(e.shock||0)-dt);e.marked=Math.max(0,(e.marked||0)-dt);e.attack-=dt;e.fire-=dt;e.stun=Math.max(0,e.stun-dt);e.slow=Math.max(0,e.slow-dt);e.charge=Math.max(0,e.charge-dt);if(e.elite)e.shield=Math.max(0,(e.shield||0)-dt);
 e.freezeLock=Math.max(0,(e.freezeLock||0)-dt);const wasHunterWinding=(e.hunterWind||0)>0,wasBruteWinding=(e.bruteWind||0)>0;e.hunterWind=Math.max(0,(e.hunterWind||0)-dt);e.hunterDash=Math.max(0,(e.hunterDash||0)-dt);e.bruteWind=Math.max(0,(e.bruteWind||0)-dt);e.bruteDash=Math.max(0,(e.bruteDash||0)-dt);if(wasHunterWinding&&e.hunterWind<=0)e.hunterDash=.43;if(wasBruteWinding&&e.bruteWind<=0)e.bruteDash=.55;e.supportCd=(e.supportCd||0)-dt;e.boosted=Math.max(0,(e.boosted||0)-dt);e.frost=Math.max(0,(e.frost||0)-dt);
 e.chill=Math.max(0,(e.chill||0)-dt*7);
 if(e.burn>0){
  e.burn=Math.max(0,e.burn-dt);e.burnClock=(e.burnClock||0)+dt;
  // Exactly one burn tick per second. Reapplication refreshes duration, does not stack.
  if(e.burnClock>=1){const ticks=Math.floor(e.burnClock);e.burnClock-=ticks;
   hurtEnemy(e,ticks*(e.burnStrength||16*S.playerDmg),{color:'#ffbd6e',silentHit:true});if(e.hp<=0)continue;}
  if(Math.random()<dt*7)burst(e.x,e.y,'#ff963b',1,40);
 }else{e.burnStrength=0;e.burnClock=0;}
 let dx=p.x-e.x,dy=p.y-e.y,d=hypot(dx,dy);let vx=dx/d,vy=dy/d;if(e.id==='sentry'&&d<240&&d>110){vx=-vx*.27;vy=-vy*.27}else if(e.id==='sentry'&&d>=240){vx*=.6;vy*=.6}
  // Hunters flank and signal their charge before bursting toward the player.
  if(e.id==='hunter'&&!e.trainingDummy){
   if(e.hunterDash>0){vx=e.dashX||vx;vy=e.dashY||vy;}
   else if(e.hunterWind>0){vx=0;vy=0;}
   else if(e.fire<=0&&d<320){e.hunterWind=.48;e.fire=rand(4.1,6.5);e.dashX=vx;e.dashY=vy;S.fx.push({type:'ring',x:e.x,y:e.y,r:37,life:.45,max:.45,col:'#ffcc82'});}
   else if(d>110){const side=Math.sin(e.seed+S.t*.8)>0?1:-1;vx=(vx*.58-vy*side*.45);vy=(vy*.58+dx/d*side*.45);}
   
  }
  // Heavy rams warn before a straight-line rush.
  if(e.id==='brute'&&!e.trainingDummy){
   if(e.bruteDash>0){vx=e.dashX||vx;vy=e.dashY||vy;}
   else if(e.bruteWind>0){vx=0;vy=0;}
   else if(e.fire<=0&&d<280){e.bruteWind=.73;e.fire=rand(5,7.5);e.dashX=vx;e.dashY=vy;S.fx.push({type:'ring',x:e.x,y:e.y,r:52,life:.7,max:.7,col:'#ff8c90'});}
   
  }
  // Sentries retreat if pursued; otherwise strafe while firing.
  if(e.id==='sentry'&&!e.trainingDummy){if(d<160){vx=-vx;vy=-vy;}else if(d<380){const sid=Math.sin(e.seed)>0?1:-1;const old=vx;vx=-vy*sid*.75+vx*.12;vy=old*sid*.75+vy*.12;}}
  // Hives repair and briefly energize nearby allies. Destroying them breaks the support.
  if(e.id==='hive'&&e.supportCd<=0&&!e.trainingDummy){
   e.supportCd=2.4;
   let count=0;for(const mate of S.enemy){if(mate===e||mate.hp<=0||mate.elite||count>=10)continue;if((mate.x-e.x)**2+(mate.y-e.y)**2<175*175){mate.hp=Math.min(mate.maxHp,mate.hp+mate.maxHp*.065);mate.boosted=2.1;count++;}}
   if(count>0)S.fx.push({type:'ring',x:e.x,y:e.y,r:145,life:.5,max:.5,col:'#cba4ff'});
  }
  if(e.id==='phantom'&&e.charge<=0&&e.fire<=0&&d<400){e.charge=.43;e.fire=4.5;S.fx.push({type:'beam',a:{x:e.x,y:e.y},b:{x:p.x,y:p.y},life:.35,max:.35,col:RED,width:1})}let spd=e.spd*(e.slow>0?.59:1)*(e.charge>0?2.7:1)*(e.hunterDash>0?2.85:1)*(e.bruteDash>0?3.1:1)*(e.boosted>0?1.20:1);if(e.stun>0){vx=0;vy=0}let pushX=0,pushY=0,gx=Math.floor(e.x/cell),gy=Math.floor(e.y/cell);
 for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const ar=grid.get((gx+ox)+','+(gy+oy));if(!ar)continue;for(const other of ar){if(e===other||other.hp<=0)continue;let ex=e.x-other.x,ey=e.y-other.y,ed=Math.hypot(ex,ey),min=(e.r+other.r)*.84;if(ed<min){let rep=(min-ed)/Math.max(ed,.001);pushX+=ex*rep*.42;pushY+=ey*rep*.42}}}
 if(e.trainingDummy){e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.08*dt);continue;}
 e.x=clamp(e.x+(vx*spd+pushX*20)*dt,-1800,1800);e.y=clamp(e.y+(vy*spd+pushY*20)*dt,-1800,1800);
 if(d<e.r+p.rad+1&&e.attack<=0){hitPlayer(e.dmg,e.x,e.y);e.attack=e.elite?.8:1.1}
 if(e.elite)bossAttack(e,dt,dx,dy,d);
 if(e.id==='sentry'&&e.fire<=0&&d<750){let a=Math.atan2(dy,dx);S.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*215,vy:Math.sin(a)*215,r:6,dmg:e.dmg*.83,col:RED,life:5});e.fire=1.85;burst(e.x,e.y,RED,3,60)}
 }
 S.enemy=S.enemy.filter(e=>e.hp>0)
}
function updateDrops(dt){
 let p=S.player;
 for(const o of S.pickups){
  o.life-=dt;const dx=p.x-o.x,dy=p.y-o.y,di=hypot(dx,dy);
  const drawn=S.magnetTimer>0&&o.type==='xp',reach=drawn?10000:S.magnet;
  if(di<reach){const m=drawn?1:Math.max(0,1-di/reach);const sp=drawn?1600:170+800*m;
   o.x+=dx/di*Math.min(di/dt,sp)*dt;o.y+=dy/di*Math.min(di/dt,sp)*dt;
  }
  if(di<22){o.life=-1;
   if(o.type==='xp'){gainXP(o.xp);if(Math.random()<.07)clickSound(760,.035,'triangle',.012)}
   else if(o.type==='shard'){S.shards+=o.xp;clickSound(1090,.13,'sine',.045)}
   else applyPowerup(o);
   burst(o.x,o.y,o.type==='xp'?TEAL:o.type==='shard'?AMBER:'#80fdab',3,45);
  }
 }
 S.pickups=S.pickups.filter(o=>o.life>0);
 for(const o of S.parts){o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.vx*=.975;o.vy*=.975}
 S.parts=S.parts.filter(o=>o.life>0);
 for(const f of S.floaters){f.t-=dt;f.y-=dt*45}S.floaters=S.floaters.filter(x=>x.t>0)
}
function executeRaid(evt){
 const bossUnderAttack=S.bosses.some(b=>b.hp>0);const mult=(S.threat>=4?1.35:S.threat>=2?1.15:1)*(bossUnderAttack?.55:1);
 const nEnemy=S.enemy.filter(e=>e.hp>0).length;
 if(nEnemy>145){banner('⚠ '+evt.name+' // ПОДКРЕПЛЕНИЕ ПРИБЛИЖАЕТСЯ',3);return;}
 for(let block=0;block<evt.units.length;block++){
  const [type,baseCount]=evt.units[block],count=Math.round(baseCount*mult);
  const center=rand(0,TAU);
  for(let k=0;k<count;k++){
   const a=center+(k-(count-1)/2)*(.15/(1+(block*.1)))+rand(-.05,.05);
   const e=spawnEnemy(type,a,440+rand(-28,30));
   if(e&&S.threat>=3&&Math.random()<.12&&!e.champion){e.champion=true;e.hp*=2;e.maxHp=e.hp;e.dmg*=1.25;e.value*=2;}
  }
 }
 banner('⚠ '+evt.name+' // ПРИОРИТЕТ ЦЕЛЕЙ!',3.4);sfx('warning',.6);
}
