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
