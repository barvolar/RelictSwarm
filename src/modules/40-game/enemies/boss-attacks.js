// Boss behaviours: readable threats with different positioning decisions.
// The caps prevent overlapping encounters from overwhelming slower phones.
function bossHazard(data){
 if(S.hazards.length>=48)return;
 S.hazards.push({...data,life:data.delay,hit:false});
}
function bossBullet(e,angle,speed,damage,color,r=7,life=4.2){
 if(S.enemyBullets.length>=120)return;
 S.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r,dmg:damage,col:color,life});
}
function bossReinforcements(e,id,count,limit=9){
 if(S.enemy.length>=148)return;
 let nearby=0;
 for(const enemy of S.enemy)if(enemy.hp>0&&!enemy.elite&&enemy.id===id&&Math.hypot(enemy.x-e.x,enemy.y-e.y)<620)nearby++;
 const n=Math.max(0,Math.min(count,limit-nearby,148-S.enemy.length));
 for(let k=0;k<n;k++){
  const a=(k+.5)*TAU/Math.max(1,n)+S.t*.15;
  spawnEnemyNear(id,e.x+Math.cos(a)*(e.r+92),e.y+Math.sin(a)*(e.r+92));
 }
}
function bossAttack(e,dt,dx,dy,d){
 if(!e.elite)return;
 e.special-=dt;
 if(e.special>0)return;
 // Interrupting a boss with control buys a fraction of a second to reposition.
 if(e.stun>0){e.special=.12;return;}
 const p=S.player,aim=Math.atan2(dy,dx),phase=e.phase?1:0;
 const turn=e.bossCycle=(e.bossCycle||0)+1;
 if(e.id==='boss1'){
  if(turn%2){
   // Reaper: the red lane predicts where the boss will physically dash.
   bossHazard({type:'dash',owner:e,x:e.x,y:e.y,ang:aim,
    len:clamp(d+55,170,540),r:29+phase*8,delay:1.05,col:'#ff8759',dmg:24+phase*9});
   banner('ЖНЕЦ: РЫВОК ПО ЛИНИИ!',1.3);
  }else{
   for(let i=-1;i<=1;i+=phase?1:2)
    bossHazard({type:'slash',owner:e,x:e.x,y:e.y,ang:aim+i*.35,
     len:500,r:25,delay:1.04+Math.abs(i)*.12,col:'#ff8759',dmg:22+phase*6});
   banner('ЖНЕЦ: ВЕЕР ЛЕЗВИЙ!',1.3);
  }
  e.special=phase?2.85:3.95;
 }else if(e.id==='boss2'){
  // Archon: a ring with a safe center or a targeted burst plus bounded guards.
  if(turn%2){
   bossHazard({type:'annulus',owner:e,x:p.x,y:p.y,inner:75,r:195,
    delay:1.35,col:'#b995ff',dmg:26+phase*7});
   bossHazard({type:'circle',owner:e,x:p.x+Math.cos(aim+1.5)*125,
    y:p.y+Math.sin(aim+1.5)*125,r:57,delay:1.6,col:'#b995ff',dmg:21+phase*6});
   banner('АРХОНТ: ВНЕШНЕЕ КОЛЬЦО, ЦЕНТР БЕЗОПАСЕН!',1.8);
  }else{
   for(let k=0;k<(phase?4:3);k++){
    const angle=k*TAU/(phase?4:3)+S.t*.3;
    bossHazard({type:'circle',owner:e,x:p.x+Math.cos(angle)*95,
     y:p.y+Math.sin(angle)*95,r:59,delay:1.05+k*.19,col:'#ad80f2',dmg:20+phase*6});
   }
   banner('АРХОНТ: ПОСЛЕДОВАТЕЛЬНЫЕ ЛОВУШКИ!',1.5);
  }
  bossReinforcements(e,'sentry',phase?3:2,phase?8:5);
  e.special=phase?4.7:6.2;
 }else if(e.id==='synth1'){
  // Guardian: cross-cuts plus an annular prison with two obvious escape choices.
  const count=phase?3:2;
  for(let k=0;k<count;k++)
   bossHazard({type:'slash',owner:e,x:e.x,y:e.y,
    ang:aim+(k-(count-1)/2)*.72,len:540,r:29+phase*7,
    delay:1.14+k*.14,col:'#ffd477',dmg:28+phase*10});
  bossHazard({type:'annulus',owner:e,x:e.x,y:e.y,inner:105,r:230,
   delay:1.48,col:'#ff9c55',dmg:30+phase*9});
  e.special=phase?3.3:4.65;
  banner('ХРАНИТЕЛЬ: РАЗРЕЗЫ И КОЛЬЦО!',1.6);
 }else if(e.id==='synth2'){
  // Smith: a spiral volley leaves a two-shot gap in the player's direction.
  const n=phase?16:12;
  for(let j=0;j<n;j++){
   if(j===0||j===n-1)continue;
   const angle=aim+j*TAU/n+S.t*.12;
   bossBullet(e,angle,240+phase*22,21+phase*6,'#88eaff',7,4);
  }
  for(let k=0;k<(phase?4:3);k++){
   const lead=k*.34;
   bossHazard({type:'circle',owner:e,
    x:p.x+p.dx*100*lead+Math.cos(k*2.4)*58,
    y:p.y+p.dy*100*lead+Math.sin(k*2.4)*58,
    r:63,delay:1.0+k*.23,col:'#75f2e8',dmg:30+phase*8});
  }
  if(phase)bossReinforcements(e,'phantom',2,5);
  e.special=phase?3.55:4.85;
  banner('КУЗНЕЦ: ПРОХОД В СПИРАЛИ + МЕТЕОРЫ!',1.6);
 }else if(e.id==='boss3'){
  // Punisher: broad parallel lanes switch axis every attack.
  const horizontal=turn%2===1,n=phase?4:3,gap=130;
  for(let k=0;k<n;k++){
   const offset=(k-(n-1)/2)*gap;
   bossHazard({type:'slash',owner:e,
    x:horizontal?p.x-320:p.x+offset,
    y:horizontal?p.y+offset:p.y-320,
    ang:horizontal?0:Math.PI/2,len:640,r:19+phase*3,
    delay:1.12+k*.13,col:'#ff7e9b',dmg:26+phase*7});
  }
  if(phase)bossHazard({type:'circle',owner:e,x:p.x,y:p.y,r:68,
   delay:1.73,col:'#ffb090',dmg:21});
  e.special=phase?3.4:4.8;
  banner('КАРАТЕЛЬ: ИЩИ ПРОХОД МЕЖДУ ЛИНИЯМИ!',1.7);
 }else if(e.id==='synth3'){
  // Reactor: switch between a safety-pocket ring and a sweeping fan.
  if(turn%2===1){
   bossHazard({type:'annulus',owner:e,x:e.x,y:e.y,inner:115,r:255,
    delay:1.25,col:'#ff99bc',dmg:32+phase*9});
   bossHazard({type:'circle',owner:e,x:p.x,y:p.y,r:66,
    delay:1.65,col:'#ffb4ce',dmg:25+phase*8});
   banner('РЕАКТОР: БЕЗОПАСНАЯ ЗОНА В ЦЕНТРЕ!',1.5);
  }else{
   const n=phase?9:6;
   for(let k=0;k<n;k++){
    const angle=aim+(k-(n-1)/2)*.22;
    bossBullet(e,angle,250+phase*32,23+phase*8,'#fa9acf',7,4.4);
   }
   bossHazard({type:'sweep',owner:e,x:e.x,y:e.y,
    ang:aim-1.0,turnSpeed:1.05+phase*.3,len:560,r:27,
    delay:1.25,col:'#fa9acf',dmg:31+phase*9});
   banner('РЕАКТОР: ВРАЩАЮЩИЙСЯ ЛУЧ!',1.6);
  }
  if(phase&&turn%2===0)bossReinforcements(e,'phantom',2,5);
  e.special=phase?3.5:4.85;
 }else if(e.id==='omega'){
  // Omega: rotate dangerous corridors and alternate a safe-centered pressure ring.
  if(turn%2===1){
   bossHazard({type:'sweep',owner:e,x:e.x,y:e.y,
    ang:aim-1.2,turnSpeed:1.18+phase*.22,len:640,
    r:33+phase*8,delay:1.55,col:'#ffc06f',dmg:34+phase*9});
   if(phase)bossHazard({type:'sweep',owner:e,x:e.x,y:e.y,
    ang:aim+1.2,turnSpeed:-1.18,len:640,r:24,
    delay:1.55,col:'#ffd699',dmg:26});
   banner('ОМЕГА: ВРАЩАЮЩИЕСЯ ЛУЧИ!',1.6);
  }else{
   bossHazard({type:'annulus',owner:e,x:e.x,y:e.y,inner:105,r:265,
    delay:1.45,col:'#ffac56',dmg:28+phase*8});
   const n=phase?12:9;
   for(let k=0;k<n;k++){
    if(k===0)continue;
    bossBullet(e,aim+k*TAU/n,230+phase*28,13+phase*5,'#ffca74',7,4.5);
   }
   banner('ОМЕГА: КОЛЬЦО ПЕРЕГРУЗКИ!',1.6);
  }
  if(phase&&turn%2===0)bossReinforcements(e,'hunter',2,5);
  e.special=phase?3.8:5.0;
 }
}
