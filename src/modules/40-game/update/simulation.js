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
