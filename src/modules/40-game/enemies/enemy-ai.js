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
