function update(dt){if(!S)return;if(trainingMode){updateTraining(dt);return;}S.t+=dt;S.spawn-=dt;S.rageTimer=Math.max(0,S.rageTimer-dt);S.invulnTimer=Math.max(0,S.invulnTimer-dt);S.magnetTimer=Math.max(0,S.magnetTimer-dt);S.powerupClock-=dt;if(S.powerupClock<=0){spawnPowerup();S.powerupClock=rand(22,34)}S.player.inv=Math.max(0,S.player.inv-dt);S.player.hit=Math.max(0,S.player.hit-dt);S.player.dashCd=Math.max(0,S.player.dashCd-dt);S.player.dashTime=Math.max(0,S.player.dashTime-dt);let p=S.player,inp=getInput(),mag=hypot(inp.x,inp.y);if(Math.abs(inp.x)+Math.abs(inp.y)>.12){p.dx=inp.x/mag;p.dy=inp.y/mag}if(p.dashTime>0){p.x+=p.dx*900*dt;p.y+=p.dy*900*dt;if(Math.random()<dt*90)burst(p.x,p.y,TEAL,1,40)}else{p.x+=inp.x*p.speed*dt;p.y+=inp.y*p.speed*dt}p.x=clamp(p.x,-1740,1740);p.y=clamp(p.y,-1740,1740);
 if(S.player.regen){S.player.hp=Math.min(S.player.maxHp,S.player.hp+S.player.regen*.12*dt)}
 S.cam.x=lerp(S.cam.x,p.x,Math.min(1,dt*5));S.cam.y=lerp(S.cam.y,p.y,Math.min(1,dt*5));
  const phase=Math.min(4,Math.floor(S.t/180));
  const bossPressure=S.bosses.some(b=>b.hp>0);const diff=Math.max(.29,1.12-S.t/1400-(S.threat-1)*.055)*(bossPressure?1.25:1);
  if(S.spawn<=0){
   const n=Math.max(1,1+(S.t>75?1:0)+(S.t>240?1:0)+(S.t>460?1:0)+(S.t>690?1:0)+(S.threat>=4?1:0)-(bossPressure?1:0));
   const pool=['scarab','scarab','hunter'];
   if(S.t>55)pool.push('brute','sentry');
   if(S.t>160)pool.push('hive','phantom','sentry','hunter');
   if(S.t>400)pool.push('phantom','brute','sentry','hive');
   if(S.t>650)pool.push('hunter','phantom','brute','sentry','hive');
   for(let i=0;i<n;i++)spawnEnemy(pool[Math.floor(Math.random()*pool.length)]);
   S.spawn=diff*rand(.78,1.24);S.spawnCount++;
  }
  RAID_EVENTS.forEach((event,i)=>{if(S.t>=event.t&&!S.raidFlags[i]){S.raidFlags[i]=true;executeRaid(event);}});
   // Never stack scheduled bosses. Old encounters finish first, followed by a short respite.
   const scheduled=[...BOSS_EVENTS.map((event,i)=>({...event,kind:'boss',i})),...SYNTH_EVENTS.map((event,i)=>({...event,kind:'synth',i}))].sort((a,b)=>a.t-b.t);
   if(!S.bosses.some(b=>b.hp>0) && S.t-(S.lastBossDefeatAt??-1000)>=10){
    const next=scheduled.find(e=>S.t>=e.t&&!(e.kind==='boss'?S.bossFlags[e.i]:S.synthFlags[e.i]));
    if(next){if(next.kind==='boss')S.bossFlags[next.i]=true;else S.synthFlags[next.i]=true;
     spawnEnemy(next.id);
     if(next.kind==='synth')banner('◈ БОСС СИНТЕЗА: '+ENEMY[next.id].name,4);
     if(next.id==='omega')toast('ОМЕГА ПРИБЫЛА: УНИЧТОЖЬ ЕЁ, ЧТОБЫ ЗАВЕРШИТЬ ЗАБЕГ',6);
    }
   }
 droneUpdate(dt);updateHybridCombat(dt);updateAreaWeapons(dt);updateProjectiles(dt);if(mode!=='playing')return;updateEnemies(dt);if(mode!=='playing')return;updateHazards(dt);updateDrops(dt);if(mode!=='playing')return;balTick(dt);
 shake=Math.max(0,shake-dt*26);if(S.t>showToastUntil)$('toast').classList.add('hidden');if(S.t>showBannerUntil)$('wavebanner').classList.add('hidden');if(S.bosses.length){const b=S.bosses[S.bosses.length-1];$('bossWrap').classList.remove('hidden');$('bossName').textContent=ENEMY[b.id].name;$('bossFill').style.width=(Math.max(0,b.hp)/b.maxHp*100)+'%'}else $('bossWrap').classList.add('hidden');S.clock-=dt;if(S.clock<=0){S.clock=.15;updateHUD()}}
function updateHUD(){
 if(!S)return;const p=S.player;
 $('hpfill').style.width=Math.max(0,p.hp/p.maxHp*100)+'%';$('hptext').textContent=Math.ceil(p.hp)+'/'+Math.ceil(p.maxHp);
 $('xpfill').style.width=Math.max(0,S.xp/S.xpNeed*100)+'%';$('leveltext').textContent='УР. '+S.lvl;
 if(trainingMode){$('timer').textContent='ПОЛИГОН';$('kills').textContent=Math.round(trainingRecord.damage).toLocaleString('ru')+' УРОНА';$('shards').textContent='DPS '+Math.round(trainingRecord.lastDps);}else{$('timer').textContent=S.t>RUN_DURATION?'БОСС':formatTime(RUN_DURATION-S.t);$('kills').textContent=S.kills+(W<=700?' УБ.':' УНИЧТОЖЕНО');$('shards').textContent='✧ '+S.shards;}
 const fb=$('forgeBtn');$('forgeCount').textContent=trainingMode?'∞':S.fusionCores;fb.classList.toggle('ready',eligibleHybrids().length>0);fb.title=trainingMode?'Управление испытанием':'Синтез: любые уровни двух нужных оружий + ядро';fb.firstChild.textContent=trainingMode?'⚙ НАСТРОЙКИ ': '◈ СИНТЕЗ ';
 const __modulesScroll=$('modules').scrollLeft;
 $('modules').innerHTML=S.drones.map(d=>{const meta=DRONES[d.id],linked=d.id.startsWith('fusion_');return `<div class="module-chip ${linked?'is-linked':''}" title="${weaponBranches(d.id).map(m=>m[1]+': +'+wm(d,m[0])).join(' · ')}" style="--c:${meta.color}"><span class="dicon">${meta.glyph}</span>${meta.name}<b>УР.${d.lvl}</b>${linked?'<span class="link-dot">✦ СИНТЕЗ</span>':''}</div>`}).join('')+`<div class="module-chip" style="--c:#8299a7;border-style:dashed;opacity:.65">СЛОТЫ <b>${S.drones.length}/${MAX_WEAPONS}</b></div>`;
 $('modules').scrollLeft=__modulesScroll;
 // v0.10.8: 5 always-visible slots on phones, no hidden horizontal carousel.
 const mobileModules=$('mobileModules');
 if(mobileModules){
  mobileModules.innerHTML=Array.from({length:MAX_WEAPONS},(_,i)=>{
   const d=S.drones[i];
   if(!d)return `<div class="mobile-weapon-slot empty" aria-label="Свободный слот ${i+1}"><span class="weapon-glyph">＋</span><span class="weapon-name">СЛОТ ${i+1}</span><span class="weapon-level">СВОБОДЕН</span></div>`;
   const meta=DRONES[d.id],linked=d.id.startsWith('fusion_');
   return `<div class="mobile-weapon-slot ${linked?'is-linked':''}" style="--c:${meta.color}" title="${meta.name}, уровень ${d.lvl}" aria-label="${meta.name}, уровень ${d.lvl}"><span class="weapon-glyph">${meta.glyph}</span><span class="weapon-name">${meta.name}</span><span class="weapon-level">УР. ${d.lvl}${linked?' ✦':''}</span></div>`;
  }).join('');
 }
 const active=[S.rageTimer>0?`ϟ ЯРОСТЬ ${Math.ceil(S.rageTimer)}с`:'',S.invulnTimer>0?`⬡ ЩИТ ${Math.ceil(S.invulnTimer)}с`:'',S.magnetTimer>0?`◎ МАГНИТ ${Math.ceil(S.magnetTimer)}с`:''].filter(Boolean);
 $('buffs').textContent=active.join('  ·  ');$('buffs').classList.toggle('hidden',!active.length);
 $('dashCool').style.transform=`scaleY(${clamp(p.dashCd/3.6,0,1)})`;$('dashBtn').style.opacity=p.dashCd>.1?.65:1;
}
// Draw everything with vector shapes. No remote sprites, fonts, or scripts required.
