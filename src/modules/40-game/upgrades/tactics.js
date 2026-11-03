// Run-only tactical rewards. Never consume weapon slots or alter permanent saves.
const TACTICS=[
 {id:'echo',name:'ЭХО РЫВКА',en:'DASH ECHO',glyph:'ϟ',one:'После рывка электрический импульс повреждает ближайших врагов.',enOne:'Dashing releases an electric pulse that damages nearby enemies.',two:'Импульс оглушает обычных врагов на 0,7 секунды.',enTwo:'The pulse also stuns regular enemies for 0.7 seconds.'},
 {id:'gravity',name:'ГРАВИТАЦИОННЫЙ СЛЕД',en:'GRAVITY TRAIL',glyph:'◎',one:'После рывка остаётся поле на 2 секунды. Враги внутри замедляются.',enOne:'Leave a 2-second slowing field at the end of a dash.',two:'При исчезновении поле стягивает обычных врагов к центру.',enTwo:'When it fades, the field pulls regular enemies inward.'},
 {id:'intercept',name:'ФАЗОВЫЙ ПЕРЕХВАТ',en:'PHASE INTERCEPT',glyph:'◇',one:'Рывок уничтожает вражеские снаряды, соприкоснувшиеся с роботом.',enOne:'Dashing destroys enemy projectiles on contact.',two:'Первый перехват за рывок ускоряет атаки на 3 секунды.',enTwo:'The first interception per dash boosts attack rate for 3 seconds.'},
 {id:'resonance',name:'РЕЗОНАНС ОРУЖИЯ',en:'WEAPON RESONANCE',glyph:'✦',one:'Каждая шестая дальнобойная атака выпускает дополнительный снаряд.',enOne:'Every sixth ranged attack launches an extra projectile.',two:'Дополнительный снаряд выбирает другую цель, если она есть.',enTwo:'The extra projectile seeks another target when available.'},
 {id:'shrapnel',name:'ОСКОЛОЧНЫЙ КАСКАД',en:'SHRAPNEL CASCADE',glyph:'✸',one:'При убийстве врага возможен взрыв осколков. Не чаще раза в секунду.',enOne:'Kills can trigger a shrapnel burst, once per second at most.',two:'Осколки дополнительно задевают врагов на большем расстоянии.',enTwo:'Shrapnel also damages enemies farther from the explosion.'},
 {id:'hunter',name:'ПРОТОКОЛ ОХОТНИКА',en:'HUNTER PROTOCOL',glyph:'⌖',one:'Попадание по боссу закрепляет его как приоритет дальнего оружия на 5 секунд.',enOne:'Hitting a boss prioritizes it for ranged weapons for 5 seconds.',two:'Попадания по отмеченному боссу периодически бьют его прислужников.',enTwo:'Hits on the tracked boss periodically damage nearby minions.'},
 {id:'mark',name:'МЕТКА РАЗРУШЕНИЯ',en:'FRACTURE MARK',glyph:'◆',one:'Каждые три раздельных попадания отмечают врага: +12% получаемого урона на 3 секунды.',enOne:'Three separate hits mark an enemy to take 12% more damage for 3 seconds.',two:'После гибели врага метка переходит на двух ближайших противников.',enTwo:'When a marked enemy dies, the mark spreads to two nearby enemies.'},
 {id:'shield',name:'АВАРИЙНЫЙ БАРЬЕР',en:'EMERGENCY BARRIER',glyph:'⬡',one:'Автоматически блокирует одно попадание. Восстановление 40 секунд.',enOne:'Automatically blocks one hit. Recharges in 40 seconds.',two:'После блокировки скорость движения повышается на 25% на 2 секунды.',enTwo:'Blocking a hit grants 25% movement speed for 2 seconds.'},
 {id:'nanites',name:'БОЕВЫЕ НАНИТЫ',en:'COMBAT NANITES',glyph:'✚',one:'Каждые 30 убийств лечат на 8 HP, не чаще раза в 18 секунд.',enOne:'Every 30 kills heals 8 HP, at most once every 18 seconds.',two:'Лишнее лечение создаёт до 12 единиц временной брони.',enTwo:'Excess healing grants up to 12 temporary armor points.'},
 {id:'retaliation',name:'КОНТУР ВОЗМЕЗДИЯ',en:'RETALIATION CIRCUIT',glyph:'↯',one:'При получении урона отталкивает ближайших врагов. Откат 12 секунд.',enOne:'Taking damage knocks nearby enemies back. 12-second cooldown.',two:'Отброшенные враги получают урон и короткое оглушение.',enTwo:'Repelled enemies also take damage and a brief stun.'},
 {id:'cryo',name:'КРИОИМПУЛЬС',en:'CRYO PULSE',glyph:'❅',one:'Каждые 14 секунд выпускает волну холода вокруг робота.',enOne:'Every 14 seconds, release a chilling wave around the robot.',two:'Гибель охлаждённого врага создаёт небольшую морозную волну.',enTwo:'Defeating a chilled enemy releases a small frost wave.'},
 {id:'chain',name:'ЦЕПНАЯ РЕАКЦИЯ',en:'CHAIN REACTION',glyph:'Ϟ',one:'Оглушение врага передаёт разряд одному соседнему врагу. Откат 2 секунды.',enOne:'Stunning an enemy arcs electricity to a neighbor. 2-second cooldown.',two:'Разряд может дополнительно перейти на ещё одного врага.',enTwo:'The discharge can jump to one additional enemy.'}
];
function tacticLv(id){return S?.tactics?.[id]||0;}
function tacticLanguage(en,ru){return typeof locale==='string'&&locale==='en'?en:ru;}
function tacticOptions(){
 const pool=TACTICS.filter(a=>tacticLv(a.id)<2),upgrades=pool.filter(a=>tacticLv(a.id)===1),picked=[];
 if(upgrades.length)picked.push(upgrades[Math.floor(Math.random()*upgrades.length)]);
 const remain=pool.filter(a=>!picked.includes(a));
 while(picked.length<3&&remain.length){const j=Math.floor(Math.random()*remain.length);picked.push(remain.splice(j,1)[0]);}
 return picked;
}
function showTacticChoices(){
 if(!S||trainingMode||S.dead)return;
 S.tacticChoices=tacticOptions();if(!S.tacticChoices.length)return;
 setMode('tactic');
 const title=tacticLanguage('BOSS DEFEATED','БОСС ПОВЕРЖЕН');
 const hint=tacticLanguage('Choose one tactical module. It lasts for this run and uses no weapon slot.','Выбери один тактический модуль. Он действует до конца забега и не занимает слот оружия.');
 $('modalContent').innerHTML='<div class="label">✦ '+title+'</div><div class="panel-title">'+tacticLanguage('TACTICAL REWARD','ТАКТИЧЕСКАЯ НАГРАДА')+'</div><p class="panel-desc">'+hint+'</p><div class="upgrade-list">'+S.tacticChoices.map((m,i)=>{
  const level=tacticLv(m.id)+1;
  const desc=level===1?tacticLanguage(m.enOne,m.one):tacticLanguage(m.enTwo,m.two);
  const tag=level===1?tacticLanguage('NEW MODULE','НОВЫЙ МОДУЛЬ'):tacticLanguage('EVOLUTION','ЭВОЛЮЦИЯ');
  return '<button type="button" class="upgrade-card upgrade-v2 upgrade-card--weapon" data-tactic="'+i+'"><span class="up-type-row"><span class="kind">'+tag+' · '+tacticLanguage('LEVEL','УР.')+' '+level+'</span></span><span class="up-heading"><span class="glyph">'+m.glyph+'</span><strong class="up-name">'+tacticLanguage(m.en,m.name)+'</strong></span><span class="up-description">'+desc+'</span><span class="number"><span class="up-action">'+tacticLanguage('SELECT','ВЫБРАТЬ')+'</span><span class="up-key">'+(i+1)+'</span></span></button>';
 }).join('')+'</div>';
 $('modalContent').querySelectorAll('[data-tactic]').forEach(b=>b.onclick=()=>chooseTactic(Number(b.dataset.tactic)));
}
function chooseTactic(i){
 if(mode!=='tactic'||!S?.tacticChoices?.[i])return;
 const m=S.tacticChoices[i];if(tacticLv(m.id)>=2)return;
 S.tactics[m.id]=tacticLv(m.id)+1;
 if(m.id==='shield'&&S.tactics[m.id]===1)S.tacticShieldReady=true;
 if(m.id==='cryo'&&S.tactics[m.id]===1)S.tacticNextCryoAt=S.t+14;
 S.tacticChoices=[];sfx('level',.8);toast(tacticLanguage('MODULE ACTIVATED: ','МОДУЛЬ АКТИВИРОВАН: ')+tacticLanguage(m.en,m.name)+' · '+S.tactics[m.id],2.8);
 if(typeof bal!=='undefined'&&bal&&!trainingMode)bal.events.push({t:Math.round(S.t),what:'tactic_pick',id:m.id+':'+S.tactics[m.id]});
 if(S.pendingUp>0)showUpgrades();else{setMode('playing');last=performance.now();updateHUD();}
}
function tacticPulse(x,y,r,damage,stun=0,chill=0){
 if(!S)return;
 S.tacticSuppress=true;
 try{for(const e of S.enemy){if(e.hp<=0)continue;const dist=Math.hypot(e.x-x,e.y-y);if(dist>r+e.r)continue;
   if(chill)applyChill(e,chill);
   hurtEnemy(e,damage,{tacticalProc:true,stun:e.elite?Math.min(.1,stun):stun});
 }}finally{S.tacticSuppress=false;}
 if(S.fx.length<160)S.fx.push({type:'ring',x,y,r,life:.35,max:.35,col:chill?'#8fe9ff':TEAL});
}
function tacticAfterDash(){
 const p=S.player;
 if(tacticLv('echo'))tacticPulse(p.x,p.y,145,24*S.playerDmg,tacticLv('echo')>1?.7:0);
 if(tacticLv('gravity')){if(S.tacticFields.length>=5)S.tacticFields.shift();S.tacticFields.push({x:p.x,y:p.y,life:2});}
}
function tacticOnIntercept(){
 if(tacticLv('intercept')>1&&!S.tacticDashIntercepted){S.tacticDashIntercepted=true;S.tacticHasteUntil=S.t+3;}
}
function tacticWeaponFired(d,pos,target,damage){
 if(!tacticLv('resonance')||!target)return;
 S.tacticFiredCount=(S.tacticFiredCount||0)+1;
 if(S.tacticFiredCount%6!==0||S.bullets.length>185)return;
 const next=tacticLv('resonance')>1?closest(target.x,target.y,280,target):null;
 launchBullet(pos.x,pos.y,next||target,Math.max(8,damage*17),'pulse',0);
}
function tacticModifyDamage(e,n,opts){
 if(!trainingMode&&n>0&&S&&e.tacticMarkedUntil>S.t)return n*1.12;
 return n;
}
function tacticOnEnemyHit(e,n,opts){
 if(!S||trainingMode||S.tacticSuppress||opts.tacticalProc||n<=0)return;
 if(tacticLv('hunter')&&e.elite){
  S.tacticBossLockUntil=S.t+5;
  if(tacticLv('hunter')>1&&S.t>(S.tacticLastHunterAt??-1000)+3){
   S.tacticLastHunterAt=S.t;
   const nearby=S.enemy.filter(z=>!z.elite&&z.hp>0&&Math.hypot(z.x-e.x,z.y-e.y)<230).slice(0,5);
   S.tacticSuppress=true;try{for(const z of nearby)hurtEnemy(z,14*S.playerDmg,{tacticalProc:true});}finally{S.tacticSuppress=false;}
  }
 }
 if(tacticLv('mark')&&e.hp>0&&S.t>(e.tacticLastMarkHit??-1000)+.12){
  e.tacticLastMarkHit=S.t;e.tacticHitCount=(e.tacticHitCount||0)+1;
  if(e.tacticHitCount>=3){e.tacticHitCount=0;e.tacticMarkedUntil=S.t+3;}
 }
 if(tacticLv('chain')&&opts.stun&&S.t>(S.tacticLastChainAt||-1000)+2){
  S.tacticLastChainAt=S.t;
  let current=e,visited=new Set([e]);
  const count=tacticLv('chain')>1?2:1;
  S.tacticSuppress=true;
  try{for(let i=0;i<count;i++){const z=S.enemy.filter(z=>z.hp>0&&!visited.has(z)&&Math.hypot(z.x-current.x,z.y-current.y)<170)[0];
   if(!z)break;visited.add(z);hurtEnemy(z,10*S.playerDmg,{tacticalProc:true,stun:.25});current=z;
  }}finally{S.tacticSuppress=false;}
 }
}
function tacticOnEnemyDeath(e){
 if(!S||trainingMode||S.tacticSuppress||e.tacticDeathDone)return;
 e.tacticDeathDone=true;
 if(tacticLv('nanites')){
  S.tacticNaniteKills=(S.tacticNaniteKills||0)+1;
  if(S.tacticNaniteKills>=30&&S.t-(S.tacticLastNanoAt||-1000)>=18){
   S.tacticNaniteKills=0;S.tacticLastNanoAt=S.t;const max=S.player.maxHp,missing=max-S.player.hp;
   heal(8);if(tacticLv('nanites')>1)S.tacticArmor=Math.min(12,(S.tacticArmor||0)+Math.max(0,8-missing));
  }
 }
 if(e.elite)return;
 if(tacticLv('shrapnel')&&S.t-(S.tacticLastShrapnelAt||-1000)>=1&&Math.random()<.38){
  S.tacticLastShrapnelAt=S.t;tacticPulse(e.x,e.y,tacticLv('shrapnel')>1?145:95,18*S.playerDmg);
 }
 if(tacticLv('mark')>1&&e.tacticMarkedUntil>S.t){
  const others=S.enemy.filter(z=>z.hp>0&&z!==e&&Math.hypot(z.x-e.x,z.y-e.y)<270).slice(0,2);
  for(const z of others)z.tacticMarkedUntil=S.t+3;
 }
 if(tacticLv('cryo')>1&&(e.frost>0||e.chill>10)){
  tacticPulse(e.x,e.y,85,5*S.playerDmg,0,35);
 }
}
function tacticAbsorbHit(){
 if(!tacticLv('shield')||!S.tacticShieldReady)return false;
 S.tacticShieldReady=false;S.tacticShieldAt=S.t+40;
 S.player.inv=Math.max(S.player.inv,.4);
 if(tacticLv('shield')>1)S.tacticSpeedUntil=S.t+2;
 if(S.fx.length<160)S.fx.push({type:'ring',x:S.player.x,y:S.player.y,r:65,life:.55,max:.55,col:BLUE});
 return true;
}
function tacticPlayerDamaged(){
 if(!tacticLv('retaliation')||S.t-(S.tacticLastRetaliationAt||-1000)<12)return;
 S.tacticLastRetaliationAt=S.t;
 S.tacticSuppress=true;
 try{for(const e of S.enemy){if(e.hp<=0||Math.hypot(e.x-S.player.x,e.y-S.player.y)>150)continue;
  if(!e.elite){const dx=e.x-S.player.x,dy=e.y-S.player.y,d=Math.max(1,Math.hypot(dx,dy));e.x+=dx/d*55;e.y+=dy/d*55;}
  if(tacticLv('retaliation')>1)hurtEnemy(e,12*S.playerDmg,{tacticalProc:true,stun:e.elite?.1:.36});
 }}finally{S.tacticSuppress=false;}
}
function tacticUpdate(dt){
 if(!S)return;
 if(tacticLv('shield')&&!S.tacticShieldReady&&S.t>=S.tacticShieldAt)S.tacticShieldReady=true;
 if(tacticLv('cryo')&&S.t>=S.tacticNextCryoAt){
  S.tacticNextCryoAt=S.t+14;tacticPulse(S.player.x,S.player.y,155,6*S.playerDmg,0,42);
 }
 const speedBoost=S.tacticSpeedUntil>S.t;
 if(speedBoost!==!!S.tacticSpeedApplied){
  if(speedBoost){S.player.speed*=1.25;S.tacticSpeedApplied=true;}
  else {S.player.speed/=1.25;S.tacticSpeedApplied=false;}
 }
 for(const f of S.tacticFields){
  f.life-=dt;
  if(f.life>0){for(const e of S.enemy)if(!e.elite&&e.hp>0&&Math.hypot(e.x-f.x,e.y-f.y)<125)e.slow=Math.max(e.slow,.22);}
  else if(tacticLv('gravity')>1)for(const e of S.enemy){if(e.elite||e.hp<=0)continue;const dx=f.x-e.x,dy=f.y-e.y,d=Math.hypot(dx,dy);if(d<185&&d>5){e.x+=dx/d*42;e.y+=dy/d*42;}}
 }
 S.tacticFields=S.tacticFields.filter(f=>f.life>0);
}
