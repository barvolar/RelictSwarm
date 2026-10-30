function showUpgrades(){
 if(S.pendingUp<1)return;
 S.upgrades=upgradeChoices();setMode('upgrade');
 $('modalContent').innerHTML=`<div class="upgrade-v2-screen">
  <div class="upgrade-topline"><div class="panel-title">ВЫБЕРИ МОДИФИКАЦИЮ</div><div class="label">УР. ${S.lvl}</div></div>
  <p class="up-short-summary">Оружие: ${S.drones.length}/${MAX_WEAPONS} · Выбери одну из трёх модификаций</p>
  <div class="upgrade-list">${S.upgrades.map((u,i)=>upgradeCardHtml(u,i)).join('')}</div>
  <p class="up-bottom-hint">Цвет рамки означает тип выбора. Редкость улучшения показана отдельно.</p>
 </div>`;
 $('modalContent').querySelectorAll('[data-up]').forEach(el=>el.onclick=()=>chooseUpgrade(+el.dataset.up));
 clickSound(810,.14,'triangle');
}
function chooseUpgrade(idx){
 if(mode!=='upgrade'||!S.upgrades[idx])return;
 const u=S.upgrades[idx],p=S.player;
 if(u.kind==='new'){if(S.drones.length>=MAX_WEAPONS||!BASE_WEAPONS.includes(u.id)||S.drones.some(d=>d.id===u.id))return;S.drones.push({id:u.id,lvl:1,cd:0,hitCd:0,mods:{}});banner('✦ НОВОЕ ОРУЖИЕ: '+DRONES[u.id].name,2.5);}
 else if(u.kind==='weapon'){
  const d=S.drones.find(x=>x.id===u.id);if(!d)return;
  for(const key of u.keys)d.mods[key]=(d.mods[key]||0)+1;
  d.lvl++;
  banner('✦ '+DRONES[u.id].name+' УР. '+d.lvl+' · '+u.rarity.name,2.4);
  burst(p.x,p.y,u.rarity.col,14+u.rarity.steps*9,150);
 }else switch(u.id){case'damage':S.playerDmg*=1.10;break;case'speed':p.speed*=1.12;break;case'hp':p.maxHp+=24;p.hp+=24;break;case'cooldown':S.haste=(S.haste||1)*1.08;break;case'magnet':S.magnet+=40;break;case'heal':heal(40);break;}
 balChoose(u);S.pendingUp--;sfx('level');
 if(S.pendingUp>0)showUpgrades();else{setMode('playing');last=performance.now();updateHUD();}
}
