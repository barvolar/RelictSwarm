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
