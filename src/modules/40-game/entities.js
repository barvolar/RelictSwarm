function spawnEnemy(id,a=null,dis=null){if(S.enemy.length>170&&!id.startsWith('boss')&&!id.startsWith('synth')&&id!=='omega'){if(bal&&!trainingMode)bal.totals.spawnBlocked++;return;}let p=S.player,ang=a??rand(0,TAU),d=dis??Math.max(360,Math.min(670,Math.max(W,H)*.55+90)),sp=ENEMY[id],factor=1+S.t/150+Math.max(0,S.lvl-18)*.012,elite=id.startsWith('boss')||id.startsWith('synth')||id==='omega';let x=clamp(p.x+Math.cos(ang)*d,-1760,1760),y=clamp(p.y+Math.sin(ang)*d,-1760,1760);const threat=THREAT_MODES[(S.threat||1)-1];let hp=sp.hp*(elite?(1+Math.max(0,S.t-180)/390):factor)*threat.hp;const obj={id,x,y,vx:0,vy:0,hp,maxHp:hp,r:sp.rad,spd:sp.spd*(1+Math.min(.3,S.t/1600))*threat.speed,dmg:sp.dmg*(elite?1:1+S.t/580)*threat.damage,t:rand(0,4),hit:0,shock:0,marked:0,attack:rand(.5,1.6),fire:rand(1,3),charge:0,slow:0,stun:0,burn:0,phase:0,special:elite?rand(1.6,3.5):0,summoned:false,seed:rand(0,500),elite,value:sp.value};if(!elite&&S.t>135&&Math.random()<Math.min(.21,.035+S.t/4800+(S.threat-1)*.023)){
 obj.champion=true;obj.hp*=3.2;obj.maxHp=obj.hp;obj.spd*=1.10;obj.dmg*=1.65;obj.r*=1.19;obj.value*=3;
 }S.enemy.push(obj);balSpawn(obj);if(elite){S.bosses.push(obj);banner('⚠ '+sp.name+' // ВЫСОКАЯ УГРОЗА',5);$('bossWrap').classList.remove('hidden')}return obj}
function burst(x,y,col,n=11,power=100){if(!S)return;for(let i=0;i<n&&S.parts.length<650;i++){let a=rand(0,TAU),v=rand(power*.15,power),life=rand(.25,.75);S.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life,max:life,size:rand(1.5,4),col})}}
function floatNum(x,y,val,col){if(S.floaters.length>70)S.floaters.shift();S.floaters.push({x,y,t:.7,val:Math.round(val),col})}
function heal(n){let p=S.player;p.hp=Math.min(p.maxHp,p.hp+n)}
function spawnPowerup(x=null,y=null,type=null){if(!S)return;const types=['magnet','rage','invuln','heal'],choice=type||types[Math.floor(Math.random()*types.length)];
 const a=rand(0,TAU),r=rand(125,240),px=x??S.player.x+Math.cos(a)*r,py=y??S.player.y+Math.sin(a)*r;
 S.pickups.push({x:clamp(px,-1750,1750),y:clamp(py,-1750,1750),xp:38,r:14,life:28,type:choice});}
function applyPowerup(o){
 switch(o.type){
 case 'core':S.fusionCores++;banner('◈ ЯДРО СИНТЕЗА ПОДОБРАНО!',4);break;
 case 'magnet':S.magnetTimer=4.5;toast('◎ МАГНИТ: ВЕСЬ ОПЫТ НА КАРТЕ!',3);break;
 case 'rage':S.rageTimer=13;toast('ϟ ЯРОСТЬ: УРОН ×2.1 НА 13 СЕКУНД',3);break;
 case 'invuln':S.invulnTimer=8;S.player.inv=Math.max(S.player.inv,8);toast('⬡ НЕУЯЗВИМОСТЬ: 8 СЕКУНД',3);break;
 case 'heal':heal(38);toast('✚ РЕМОНТ КОРПУСА',2);break;
 }
 sfx('pickup');burst(S.player.x,S.player.y,o.type==='rage'?AMBER:o.type==='invuln'?BLUE:TEAL,35,150);
}
function applyChill(e,amount){
 if(e.hp<=0)return;
 const resistant=e.elite?4:e.champion?2.2:e.id==='brute'?1.55:1;
 if(e.freezeLock>0){e.chill=Math.min(99,(e.chill||0)+amount*.15/resistant);return;}
 e.chill=Math.min(100,(e.chill||0)+amount/resistant);
 e.slow=Math.max(e.slow,.65);
 if(e.chill>=100){
  e.chill=0;
  if(e.elite){e.slow=Math.max(e.slow,1.1);e.freezeLock=2.6;}
  else{e.stun=Math.max(e.stun,.85);e.frost=Math.max(e.frost||0,.85);e.freezeLock=3.2;}
  burst(e.x,e.y,'#a7efff',8,65);
 }
}
function hurtEnemy(e,n,opts={}){if(e.hp<=0||!Number.isFinite(n))return;
 if(e.elite){
  const hit=calculateBossDamage(e,n,S.t,S.threat);
  n=hit.damage;
  e.damageSecondAt=hit.damageSecondAt;e.damageSecond=hit.damageSecond;
  if(bal&&!trainingMode){
   const record=bal.bosses.find(b=>b.id===e.balId);
   if(record){record.blockedByHitCap+=hit.blockedByHitCap;record.blockedByShield+=hit.blockedByShield;record.blockedByDpsCap+=hit.blockedByDpsCap;}
   bal.totals.bossDamageBlocked+=hit.blockedTotal;
  }
 }
 if(trainingMode){trainingRecord.damage+=n;trainingRecord.hits.push({t:S.t,d:n});if(trainingRecord.hits.length>3200)trainingRecord.hits.splice(0,1000)}
 const before=e.hp;balDamage(e,before,n);e.hp-=n;
 if(n>0&&!opts.burn&&!opts.silentHit&&Math.random()<.16)sfx('hit',.7);
 if(e.elite&&before/e.maxHp>.52&&e.hp/e.maxHp<=.52){e.phase=1;e.shield=2.0;burst(e.x,e.y,ENEMY[e.id].col,45,220);banner('⚠ ВТОРАЯ ФАЗА: '+ENEMY[e.id].name,3.5);sfx('bossPhase');shake=14;}
 e.hit=.11;if(opts.slow)e.slow=Math.max(e.slow,opts.slow);if(opts.stun)e.stun=Math.max(e.stun,opts.stun);if(opts.burn){e.burn=Math.max(e.burn,opts.burn);e.burnStrength=Math.max(e.burnStrength||0,opts.burnPower||16*S.playerDmg*(1+S.t/500));e.burnClock??=0;}if(opts.knock){let m=hypot(e.x-S.player.x,e.y-S.player.y);e.x+=(e.x-S.player.x)/m*opts.knock;e.y+=(e.y-S.player.y)/m*opts.knock}if(e.trainingDummy){
  e.displayDamage=(e.displayDamage||0)+n;
  if(S.t-(e.lastDamageDisplay||-1)>=.22){floatNum(e.x+rand(-5,5),e.y-25,e.displayDamage,'#ffebae');e.lastDamageDisplay=S.t;e.displayDamage=0;}
 }else if(n>8&&Math.random()<.38)floatNum(e.x+rand(-8,8),e.y-25,n,opts.crit?AMBER:'#dbffff');if(e.hp<=0)killEnemy(e)}
function killEnemy(e){if(e.hp>0)return;if(trainingMode){S.kills++;burst(e.x,e.y,ENEMY[e.id].col,12,100);return;}const z=ENEMY[e.id];S.kills++;balKill(e);if(!e.elite&&Math.random()<.13)sfx('kill',.65);S.score+=z.value;burst(e.x,e.y,z.col,e.elite?55:10,e.elite?260:110);S.fx.push({type:'ring',x:e.x,y:e.y,r:e.r,life:.4,max:.4,col:z.col});S.pickups.push({x:e.x+rand(-6,6),y:e.y+rand(-6,6),xp:z.xp,r:7,life:30,type:'xp'});if(Math.random()<(e.elite?1:e.champion?.35:.025)){S.pickups.push({x:e.x+rand(-10,10),y:e.y+rand(-10,10),xp:e.elite?28:1,r:9,life:30,type:'shard'})}if(Math.random()<.025){S.pickups.push({x:e.x,y:e.y+12,xp:32,r:8,life:40,type:'heal'})}if(e.champion&&Math.random()<.21)spawnPowerup(e.x,e.y);if(e.id==='hive'){for(let i=0;i<2;i++)spawnEnemyNear('scarab',e.x,e.y)}if(e.elite){sfx('heavyExplosion',1,true);sfx('bossDown');S.bosses=S.bosses.filter(z=>z!==e);S.lastBossDefeatAt=S.t;$('bossWrap').classList.toggle('hidden',S.bosses.length===0);if(e.id==='omega'){finish(true);return}if(e.id.startsWith('synth')){S.pickups.push({x:e.x,y:e.y,xp:1,r:17,life:120,type:'core'});burst(e.x,e.y,AMBER,65,290);banner('◈ БОСС ПАЛ! ПОДБЕРИ ЯДРО СИНТЕЗА!',5)}else banner('✦ БОСС ПОВЕРЖЕН!',2.8)}if(Math.random()<.10)clickSound(100+Math.random()*90,.07,'triangle',.012)}
function spawnEnemyNear(id,x,y){const e=spawnEnemy(id,rand(0,TAU),280);if(e){e.x=x+rand(-22,22);e.y=y+rand(-22,22)}}
function hitPlayer(dmg,x,y){if(trainingMode)return;const p=S.player;if(p.inv>0||S.dead)return;balPlayerHit(Math.min(p.hp,dmg));p.hp-=dmg;p.inv=.62;p.hit=.32;shake=Math.max(shake,7);burst(p.x,p.y,RED,18,160);floatNum(p.x,p.y-35,dmg,RED);sfx('damage');if(p.hp<=0){p.hp=0;finish(false)}}
function gainXP(n){if(trainingMode)return;S.xp+=n;while(S.xp>=S.xpNeed){S.xp-=S.xpNeed;S.lvl++;S.xpNeed=Math.floor(17+S.lvl*11+Math.pow(S.lvl,1.26)*2.8);S.pendingUp++;heal(4)}if(S.pendingUp>0&&mode==='playing')showUpgrades()}
